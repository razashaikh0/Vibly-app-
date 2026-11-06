import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Gift, Heart, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/rooms";
import { CharmBadge } from "@/components/SeatFrame";
import { activeLevel } from "@/lib/levels";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

type Member = {
  id: string;
  name: string;
  avatar: string | null;
  coins: number;
  charm: number;
  sent: number;
  activity: number;
  familyName: string | null;
  familyPoints: number;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Room member ranking: charm (gifts received this week in-room) + active score,
 * with the family weekly activeness of each member highlighted.
 */
export function RoomMemberRanking({
  roomId,
  memberIds,
  onGift,
}: {
  roomId: string;
  memberIds: string[];
  onGift?: ((user: { id: string; name: string }) => void) | undefined;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"charm" | "active" | "family">("charm");

  const ids = useMemo(() => [...new Set(memberIds)].sort().join(","), [memberIds]);

  const load = useCallback(async () => {
    const list = ids ? ids.split(",") : [];
    if (list.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }
    const since = new Date(Date.now() - WEEK_MS).toISOString();
    const [profilesRes, giftsRes, famRes, actRes] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url, coins").in("id", list),
      supabase
        .from("gift_events")
        .select("sender_id, receiver_id, total_price")
        .eq("room_id", roomId)
        .gte("created_at", since),
      supabase
        .from("family_members")
        .select("user_id, points, families:family_id(name)")
        .in("user_id", list),
      // chat + join activity points awarded by the database triggers
      supabase
        .from("room_activity")
        .select("user_id, points")
        .eq("room_id", roomId)
        .in("user_id", list),
    ]);

    const activity = new Map<string, number>();
    for (const a of (actRes.data ?? []) as { user_id: string; points: number | string }[]) {
      activity.set(a.user_id, Number(a.points ?? 0));
    }

    const charm = new Map<string, number>();
    const sent = new Map<string, number>();
    for (const g of (giftsRes.data ?? []) as {
      sender_id: string;
      receiver_id: string;
      total_price: number | string;
    }[]) {
      const amount = Number(g.total_price ?? 0);
      charm.set(g.receiver_id, (charm.get(g.receiver_id) ?? 0) + amount);
      sent.set(g.sender_id, (sent.get(g.sender_id) ?? 0) + amount);
    }

    const fam = new Map<string, { name: string | null; points: number }>();
    for (const f of (famRes.data ?? []) as unknown as {
      user_id: string;
      points: number;
      families: { name: string } | null;
    }[]) {
      fam.set(f.user_id, { name: f.families?.name ?? null, points: Number(f.points ?? 0) });
    }

    const rows: Member[] = (
      (profilesRes.data ?? []) as {
        id: string;
        display_name: string;
        avatar_url: string | null;
        coins: number | string;
      }[]
    ).map((p) => ({
      id: p.id,
      name: p.display_name,
      avatar: p.avatar_url,
      coins: Number(p.coins ?? 0),
      charm: charm.get(p.id) ?? 0,
      sent: sent.get(p.id) ?? 0,
      activity: activity.get(p.id) ?? 0,
      familyName: fam.get(p.id)?.name ?? null,
      familyPoints: fam.get(p.id)?.points ?? 0,
    }));

    setMembers(rows);
    setLoading(false);
  }, [ids, roomId]);

  useEffect(() => {
    void load();
  }, [load]);

  // coalesce bursty gift/family events into a single refetch
  const reload = useDebouncedCallback(load, 500);
  useEffect(() => {
    const ch = supabase
      .channel(`room-rank-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gift_events", filter: `room_id=eq.${roomId}` },
        () => reload(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "family_members" }, () =>
        reload(),
      )
      // chat messages and room joins award activity points through triggers
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_activity", filter: `room_id=eq.${roomId}` },
        () => reload(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [roomId, reload]);

  const ranked = useMemo(() => {
    const copy = [...members];
    if (mode === "charm") copy.sort((a, b) => b.charm - a.charm || b.coins - a.coins);
    else if (mode === "active")
      copy.sort((a, b) => b.activity - a.activity || b.sent - a.sent || b.coins - a.coins);
    else copy.sort((a, b) => b.familyPoints - a.familyPoints);
    return copy;
  }, [members, mode]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "charm", label: "💎 Charm" },
            { key: "active", label: "⚡ Active" },
            { key: "family", label: "🏰 Family weekly" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setMode(t.key)}
            aria-pressed={mode === t.key}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              mode === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 text-xs">
        <Link
          to="/family"
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-semibold hover:bg-primary/15"
        >
          <Users className="h-3.5 w-3.5 text-primary" /> Family weekly ranking
        </Link>
        <Link
          to="/cp"
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-semibold hover:bg-primary/15"
        >
          <Heart className="h-3.5 w-3.5 text-primary" /> CP timeline
        </Link>
      </div>

      {loading ? (
        <div className="grid h-28 place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : ranked.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No live members in this room right now.
        </p>
      ) : (
        <ul className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
          {ranked.map((m, i) => (
            <li
              key={m.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                i < 3 ? "bg-gold/12 ring-1 ring-gold/30" : "bg-muted/50"
              }`}
            >
              <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                {i + 1}
              </span>
              <Avatar className="h-9 w-9">
                <AvatarImage src={m.avatar ?? undefined} alt={m.name} />
                <AvatarFallback>{initials(m.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <Link
                  to="/profile/$userId"
                  params={{ userId: m.id }}
                  className="block truncate text-sm font-semibold hover:underline"
                >
                  {m.name}
                </Link>
                <p className="text-[11px] text-muted-foreground">
                  {mode === "family"
                    ? `${m.familyName ?? "No family"} · ${m.familyPoints.toLocaleString()} weekly pts`
                    : mode === "active"
                      ? `Active Lv.${activeLevel(m.sent)} · ${m.activity.toLocaleString()} room pts · 🪙 ${m.sent.toLocaleString()} sent (7d)`
                      : `🪙 ${m.charm.toLocaleString()} charm (7d)`}
                </p>
              </div>
              {onGift ? (
                <button
                  type="button"
                  onClick={() => onGift({ id: m.id, name: m.name })}
                  aria-label={`Send a gift to ${m.name}`}
                  title={`Send a gift to ${m.name}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20"
                >
                  <Gift className="h-4 w-4" />
                </button>
              ) : null}
              {mode === "family" && m.familyName ? (
                <Badge variant="secondary" className="rounded-full text-[10px]">
                  {m.familyName}
                </Badge>
              ) : (
                <CharmBadge charm={m.coins} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
