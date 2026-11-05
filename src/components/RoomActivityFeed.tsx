import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fxLabel, rowToFx, timeAgo, vipTier, type FxEvent, type FxKind, type FxRow } from "@/lib/fx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/rooms";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

const PAGE_SIZE = 20;

type Filter = "all" | FxKind;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "red_packet", label: "🧧 Red packets" },
  { key: "big_gift", label: "🎁 40k+ gifts" },
  { key: "vip_entry", label: "👑 VIP entries" },
];

function badge(evt: FxEvent) {
  if (evt.kind === "red_packet") return { emoji: "🧧", tint: "bg-destructive/12 text-destructive" };
  if (evt.kind === "big_gift")
    return { emoji: evt.emoji ?? "🎁", tint: "bg-primary/12 text-primary" };
  const tier = vipTier(evt.vipLevel ?? 1);
  return { emoji: tier?.emoji ?? "✨", tint: "bg-gold/18 text-accent-foreground" };
}

/** Scrollable, filterable log of every red packet, 40k+ gift and VIP entry. */
export function RoomActivityFeed({ roomId }: { roomId: string }) {
  const [events, setEvents] = useState<FxEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const sentinel = useRef<HTMLLIElement | null>(null);

  const fetchPage = useCallback(
    async (before: number | null) => {
      let q = supabase
        .from("room_fx_events")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (filter !== "all") q = q.eq("kind", filter);
      if (before) q = q.lt("created_at", new Date(before).toISOString());
      const { data } = await q;
      return ((data ?? []) as FxRow[]).map(rowToFx);
    },
    [roomId, filter],
  );

  // reset + first page whenever the filter changes
  useEffect(() => {
    let active = true;
    setLoading(true);
    setDone(false);
    void (async () => {
      const page = await fetchPage(null);
      if (!active) return;
      setEvents(page);
      setDone(page.length < PAGE_SIZE);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || done) return;
    const oldest = events[events.length - 1]?.createdAt ?? null;
    if (!oldest) return;
    setLoadingMore(true);
    const page = await fetchPage(oldest);
    setEvents((prev) => {
      const seen = new Set(prev.map((e) => e.id));
      return [...prev, ...page.filter((e) => !seen.has(e.id))];
    });
    setDone(page.length < PAGE_SIZE);
    setLoadingMore(false);
  }, [events, fetchPage, loading, loadingMore, done]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: "120px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore]);

  useEffect(() => {
    const ch = supabase
      .channel(`fx-feed-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_fx_events",
          filter: `room_id=eq.${roomId}`,
        },
        ({ new: row }) => {
          const evt = rowToFx(row as FxRow);
          setEvents((prev) => (prev.some((e) => e.id === evt.id) ? prev : [evt, ...prev]));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [roomId]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return events
      .filter((e) => filter === "all" || e.kind === filter)
      .filter((e) => !needle || fxLabel(e).toLowerCase().includes(needle));
  }, [events, filter, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by sender or gift"
          className="pl-9"
          aria-label="Search activity feed"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid h-32 place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {query.trim() ? "No events match your search." : "No events recorded yet."}
        </p>
      ) : (
        <ul className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
          {visible.map((evt) => {
            const b = badge(evt);
            return (
              <li key={evt.id} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={evt.actorAvatar ?? undefined} alt={evt.actorName} />
                  <AvatarFallback>{initials(evt.actorName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{fxLabel(evt)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(evt.createdAt).toLocaleTimeString()} · {timeAgo(evt.createdAt)}
                  </p>
                </div>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg ${b.tint}`}
                >
                  {b.emoji}
                </span>
              </li>
            );
          })}
          <li ref={sentinel} className="h-6">
            {loadingMore ? (
              <div className="grid place-items-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : done ? (
              <p className="py-2 text-center text-[11px] text-muted-foreground">
                That&apos;s the whole history.
              </p>
            ) : null}
          </li>
        </ul>
      )}
    </div>
  );
}
