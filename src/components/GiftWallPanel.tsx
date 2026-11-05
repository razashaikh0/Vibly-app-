import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  Copy,
  Download,
  Loader2,
  Pause,
  Play,
  Search,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { initials } from "@/lib/rooms";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import {
  FRAME_TIERS,
  charmProgress,
  frameTier,
  nextFrameTier,
  activeLevel,
} from "@/lib/levels";

type MiniUser = {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
};

type WallRow = {
  id: string;
  quantity: number;
  total_price: number;
  created_at: string;
  gifts: { name: string; emoji: string } | null;
  sender: MiniUser | null;
  receiver: MiniUser | null;
};

type Aggregate = {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
  charm: number;
  gifts: number;
};

const WINDOWS = [
  { key: "10m", label: "10 min", ms: 10 * 60 * 1000 },
  { key: "1h", label: "1 hour", ms: 60 * 60 * 1000 },
  { key: "24h", label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { key: "all", label: "All time", ms: 0 },
] as const;

type WindowKey = (typeof WINDOWS)[number]["key"];

const PAGE_SIZE = 20;

/** Short public ID shown on the wall instead of raw charm numbers. */
function userId(u: { username: string | null; id: string }) {
  return u.username ? `@${u.username}` : `ID ${u.id.slice(0, 8)}`;
}

/** Clickable public ID that opens the user's profile. */
function UserIdLink({
  user,
  className = "",
}: {
  user: { id: string; username: string | null };
  className?: string;
}) {
  return (
    <Link
      to="/profile/$userId"
      params={{ userId: user.id }}
      onClick={(e) => e.stopPropagation()}
      title="Open profile"
      className={`font-medium text-primary hover:underline ${className}`}
    >
      {userId(user)}
    </Link>
  );
}

function download(name: string, mime: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Live gift wall for a room: every gift, plus charm (received) and EXP (sent)
 * totals that follow the exact tier maths shown on /levels.
 */
export function GiftWallPanel({ roomId }: { roomId: string }) {
  const [rows, setRows] = useState<WallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"wall" | "charm" | "rules">("wall");
  const [win, setWin] = useState<WindowKey>("1h");
  const [query, setQuery] = useState("");
  const [live, setLive] = useState(true);
  const [pending, setPending] = useState(0);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const liveRef = useRef(true);
  liveRef.current = live;

  const load = useCallback(
    async (mode: "full" | "soft" = "full") => {
      if (mode === "soft") setRefreshing(true);
      setError(false);
      const spec = WINDOWS.find((w) => w.key === win)!;
      let query = supabase
        .from("gift_events")
        .select(
          "id, quantity, total_price, created_at, gifts:gift_id(name, emoji), sender:sender_id(id, display_name, username, avatar_url), receiver:receiver_id(id, display_name, username, avatar_url)",
        )
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(300);
      if (spec.ms > 0) query = query.gte("created_at", new Date(Date.now() - spec.ms).toISOString());
      const { data, error: err } = await query;
      if (err) {
        setError(true);
      } else {
        setRows((data ?? []) as unknown as WallRow[]);
        setPending(0);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [roomId, win],
  );

  useEffect(() => {
    setLoading(true);
    void load("full");
  }, [load]);

  // real-time: bursty inserts are coalesced into one refetch so the panel
  // re-renders once instead of per event; soft mode keeps the current UI
  const reload = useDebouncedCallback(() => void load("soft"), 400);
  useEffect(() => {
    const ch = supabase
      .channel(`gift-wall-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gift_events", filter: `room_id=eq.${roomId}` },
        () => {
          if (liveRef.current) reload();
          else setPending((n) => n + 1);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [roomId, reload]);

  // sender / receiver ID (or name) filter for the history wall
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q) return rows;
    const matches = (u: MiniUser | null) =>
      !!u &&
      ((u.username ?? "").toLowerCase().includes(q) ||
        u.id.toLowerCase().startsWith(q) ||
        u.display_name.toLowerCase().includes(q));
    return rows.filter((r) => matches(r.sender) || matches(r.receiver));
  }, [rows, query]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, win, tab]);

  const pageRows = useMemo(() => filteredRows.slice(0, visible), [filteredRows, visible]);

  const onScroll = (e: React.UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      setVisible((v) => (v < filteredRows.length ? v + PAGE_SIZE : v));
    }
  };

  const exportData = (format: "csv" | "json") => {
    if (filteredRows.length === 0) {
      toast.info("Nothing to export in this filter.");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const base = `gift-wall-${win}${query.trim() ? `-${query.trim().replace(/[^\w@.-]/g, "")}` : ""}-${stamp}`;
    const items = filteredRows.map((r) => ({
      time: r.created_at,
      gift: r.gifts?.name ?? "Gift",
      emoji: r.gifts?.emoji ?? "🎁",
      quantity: r.quantity,
      coins: Number(r.total_price ?? 0),
      sender_id: r.sender?.id ?? "",
      sender: r.sender ? userId(r.sender) : "",
      sender_name: r.sender?.display_name ?? "",
      receiver_id: r.receiver?.id ?? "",
      receiver: r.receiver ? userId(r.receiver) : "",
      receiver_name: r.receiver?.display_name ?? "",
    }));
    if (format === "json") {
      download(`${base}.json`, "application/json", JSON.stringify(items, null, 2));
    } else {
      const headers = Object.keys(items[0] ?? {});
      const csv = [
        headers.join(","),
        ...items.map((it) => headers.map((h) => csvCell((it as never)[h])).join(",")),
      ].join("\n");
      download(`${base}.csv`, "text/csv;charset=utf-8", csv);
    }
    toast.success(`Exported ${items.length} gifts as ${format.toUpperCase()}`);
  };

  const { charmBoard, expBoard } = useMemo(() => {
    const charm = new Map<string, Aggregate>();
    const exp = new Map<string, Aggregate>();
    const bump = (map: Map<string, Aggregate>, u: MiniUser, amount: number, qty: number) => {
      const cur = map.get(u.id) ?? {
        id: u.id,
        name: u.display_name,
        username: u.username,
        avatar: u.avatar_url,
        charm: 0,
        gifts: 0,
      };
      cur.charm += amount;
      cur.gifts += qty;
      map.set(cur.id, cur);
    };
    for (const r of rows) {
      const amount = Number(r.total_price ?? 0);
      if (r.receiver) bump(charm, r.receiver, amount, r.quantity);
      if (r.sender) bump(exp, r.sender, amount, r.quantity);
    }
    return {
      charmBoard: [...charm.values()].sort((a, b) => b.charm - a.charm),
      expBoard: [...exp.values()].sort((a, b) => b.charm - a.charm),
    };
  }, [rows]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(
          [
            { key: "wall", label: "🎁 Wall" },
            { key: "charm", label: "💎 Charm & EXP" },
            { key: "rules", label: "📜 Rules" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "rules" ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">History:</span>
          {WINDOWS.map((w) => (
            <button
              key={w.key}
              type="button"
              onClick={() => setWin(w.key)}
              aria-pressed={win === w.key}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                win === w.key
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {w.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const next = !live;
              setLive(next);
              if (next && pending > 0) void load("soft");
            }}
            aria-pressed={live}
            className={`ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
              live
                ? "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30"
                : "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30"
            }`}
          >
            {live ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {live ? "Live" : "Paused"}
          </button>
        </div>
      ) : null}

      {tab === "wall" && !loading ? (
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by @username, ID or name…"
              aria-label="Filter gifts by user"
              className="w-full rounded-lg bg-muted/60 py-1.5 pl-8 pr-3 text-xs outline-none ring-primary/30 placeholder:text-muted-foreground/70 focus:ring-2"
            />
          </div>
          <button
            type="button"
            onClick={() => exportData("csv")}
            title="Export filtered gifts as CSV"
            className="flex items-center gap-1 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-primary"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            type="button"
            onClick={() => exportData("json")}
            title="Export filtered gifts as JSON"
            className="flex items-center gap-1 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-primary"
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid h-28 place-items-center" role="status" aria-label="Loading gift wall">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="grid place-items-center gap-2 py-10 text-center">
          <TriangleAlert className="h-5 w-5 text-destructive" />
          <p className="text-sm text-muted-foreground">Couldn&apos;t load the gift wall.</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load("full");
            }}
            className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
          >
            Retry
          </button>
        </div>
      ) : tab === "wall" ? (
        <div className="space-y-2">
          {refreshing ? (
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Updating live…
            </p>
          ) : null}
          {!live && pending > 0 ? (
            <button
              type="button"
              onClick={() => {
                setLive(true);
                void load("soft");
              }}
              className="w-full rounded-lg bg-primary/10 py-1.5 text-[11px] font-semibold text-primary"
            >
              {pending} new gift{pending > 1 ? "s" : ""} — resume live
            </button>
          ) : null}
          {filteredRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {query
                ? `No gifts found for "${query.trim()}" in this range.`
                : "No gifts in this time range — send the first one."}
            </p>
          ) : (
            <ul className="max-h-[46vh] space-y-2 overflow-y-auto pr-1" onScroll={onScroll}>
              {pageRows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
                  <span className="text-xl">{r.gifts?.emoji ?? "🎁"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-semibold">{r.sender?.display_name ?? "Player"}</span> →{" "}
                      {r.receiver?.display_name ?? "someone"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {r.gifts?.name ?? "Gift"} ×{r.quantity}
                      {r.receiver ? (
                        <>
                          {" · to "}
                          <UserIdLink user={r.receiver} />
                        </>
                      ) : (
                        ""
                      )}
                    </p>
                  </div>
                  {r.receiver ? <CopyIdButton user={r.receiver} /> : null}
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleTimeString()}
                  </span>
                </li>
              ))}
              {visible < filteredRows.length ? (
                <li className="py-2 text-center">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground"
                  >
                    Load more ({filteredRows.length - visible} left)
                  </button>
                </li>
              ) : null}
            </ul>
          )}
        </div>
      ) : tab === "charm" ? (
        <div className="max-h-[46vh] space-y-4 overflow-y-auto pr-1">
          <Board title="Charm received" rows={charmBoard} showTier />
          <Board title="EXP sent (coin power)" rows={expBoard} />
        </div>
      ) : (
        <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1 text-sm">
          <p className="text-muted-foreground">
            Charm = total coin value of gifts received in this room. EXP = coin value sent. Tiers
            below are the same as the{" "}
            <Link to="/levels" className="font-semibold text-primary hover:underline">
              Charm &amp; Active levels
            </Link>{" "}
            page.
          </p>
          <ul className="divide-y divide-border/60 rounded-xl bg-muted/40">
            {FRAME_TIERS.map((t) => (
              <li key={t.level} className="flex items-center gap-3 px-3 py-2">
                <span className="text-lg">{t.icon}</span>
                <span className="flex-1 text-sm font-medium">
                  Lv.{t.level} {t.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t.charm.toLocaleString()}+ charm
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** One-click copy of a user's public ID (@username / ID xxxx) with feedback. */
function CopyIdButton({ user }: { user: MiniUser | Aggregate }) {
  const [copied, setCopied] = useState(false);
  const idText = userId(user);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(idText);
    } catch {
      // clipboard blocked (e.g. insecure context) — still show the value
      toast.info(idText, { description: "Copy manually" });
      return;
    }
    setCopied(true);
    toast.success(`Copied ${idText}`);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${idText}`}
      title={`Copy ${idText}`}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-background/70 text-muted-foreground transition hover:bg-background hover:text-primary"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

const Board = memo(function Board({
  title,
  rows,
  showTier,
}: {
  title: string;
  rows: Aggregate[];
  showTier?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.slice(0, 10).map((r, i) => {
            const tier = frameTier(r.charm);
            const next = nextFrameTier(r.charm);
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={r.avatar ?? undefined} alt={r.name} />
                  <AvatarFallback>{initials(r.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate text-[11px]">
                    <UserIdLink user={r} />
                  </p>
                  {showTier ? (
                    <>
                      <p className="text-[11px] text-muted-foreground">
                        {tier.icon} {tier.title}
                        {next ? ` · ${(next.charm - r.charm).toLocaleString()} to ${next.title}` : ""}
                      </p>
                      <Progress value={charmProgress(r.charm)} className="mt-1 h-1.5" />
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Active Lv.{activeLevel(r.charm)} · {r.gifts} gifts sent
                    </p>
                  )}
                </div>
                <CopyIdButton user={r} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
