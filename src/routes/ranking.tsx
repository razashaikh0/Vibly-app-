import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/rooms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — Top Charm, VIP & Hottest Voice Rooms" },
      {
        name: "description",
        content:
          "Daily leaderboards for the most charming users, top gifters and the hottest live voice rooms.",
      },
      { property: "og:title", content: "Ranking — Top Charm, VIP & Hottest Rooms" },
      {
        property: "og:description",
        content: "See who is topping charm, VIP spending and room heat today.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RankingPage,
});

type Tab = "popularity" | "vip" | "room";
type Range = "today" | "weekly" | "total";

const TABS: { key: Tab; label: string; metric: string; theme: string }[] = [
  { key: "popularity", label: "Popularity", metric: "Charm", theme: "from-primary/20 to-transparent" },
  { key: "vip", label: "VIP", metric: "Growth", theme: "from-gold/30 to-transparent" },
  { key: "room", label: "Room", metric: "Heat", theme: "from-chart-4/25 to-transparent" },
];

const RANGES: { key: Range; label: string; days: number | null }[] = [
  { key: "today", label: "Today", days: 1 },
  { key: "weekly", label: "Weekly", days: 7 },
  { key: "total", label: "Total", days: null },
];

type Entry = { id: string; name: string; avatar: string | null; score: number };

function RankingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("popularity");
  const [range, setRange] = useState<Range>("today");

  const days = RANGES.find((r) => r.key === range)?.days ?? null;

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["ranking-events", range],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("gift_events")
        .select(
          "total_price, created_at, sender:sender_id(id, display_name, avatar_url), receiver:receiver_id(id, display_name, avatar_url), room:room_id(id, name, cover_emoji)",
        )
        .order("created_at", { ascending: false })
        .limit(2000);
      if (days) {
        query = query.gte(
          "created_at",
          new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        );
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as {
        total_price: number;
        sender: { id: string; display_name: string; avatar_url: string | null } | null;
        receiver: { id: string; display_name: string; avatar_url: string | null } | null;
        room: { id: string; name: string; cover_emoji: string } | null;
      }[];
    },
    refetchInterval: 20000,
  });

  const entries = useMemo<Entry[]>(() => {
    const map = new Map<string, Entry>();
    for (const ev of events) {
      const target =
        tab === "popularity"
          ? ev.receiver && { id: ev.receiver.id, name: ev.receiver.display_name, avatar: ev.receiver.avatar_url }
          : tab === "vip"
            ? ev.sender && { id: ev.sender.id, name: ev.sender.display_name, avatar: ev.sender.avatar_url }
            : ev.room && { id: ev.room.id, name: `${ev.room.cover_emoji} ${ev.room.name}`, avatar: null };
      if (!target) continue;
      const prev = map.get(target.id);
      map.set(target.id, {
        ...target,
        score: (prev?.score ?? 0) + Number(ev.total_price ?? 0),
      });
    }
    return [...map.values()].sort((a, b) => b.score - a.score).slice(0, 30);
  }, [events, tab]);

  const active = TABS.find((t) => t.key === tab)!;
  const podium = [entries[1], entries[0], entries[2]];
  const rest = entries.slice(3);

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <div className={`bg-gradient-to-b ${active.theme} pb-6`}>
        <header className="mx-auto flex max-w-lg items-center gap-2 px-3 py-3">
          <Button size="icon" variant="ghost" asChild aria-label="Back">
            <Link to="/games">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="flex-1 text-center text-lg font-bold">Ranking</h1>
          <span className="w-9" />
        </header>

        <div className="mx-auto flex max-w-lg gap-4 overflow-x-auto px-4 pb-3 text-lg font-bold">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap transition-opacity ${
                tab === t.key ? "opacity-100" : "opacity-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mx-auto flex max-w-lg gap-1 rounded-full bg-background/60 p-1 text-sm font-medium mx-4">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
                range === r.key ? "bg-background shadow" : "text-muted-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 items-end gap-2 px-4">
          {podium.map((entry, i) => {
            const place = i === 1 ? 1 : i === 0 ? 2 : 3;
            const height = place === 1 ? "h-32" : "h-24";
            const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
            return (
              <div key={place} className="flex flex-col items-center">
                <span className="text-2xl">{medal}</span>
                <Avatar className="mb-1 mt-1 h-14 w-14 ring-2 ring-background">
                  <AvatarImage src={entry?.avatar ?? undefined} alt={entry?.name ?? "Empty"} />
                  <AvatarFallback>{entry ? initials(entry.name) : "—"}</AvatarFallback>
                </Avatar>
                <div
                  className={`glass ${height} w-full rounded-t-2xl px-1 pt-2 text-center text-xs`}
                >
                  <p className="truncate font-semibold">{entry?.name ?? "Empty"}</p>
                  <p className="font-bold text-primary">{entry?.score.toLocaleString() ?? 0}</p>
                  <p className="text-muted-foreground">{active.metric}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : rest.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {active.metric.toLowerCase()} yet — send some gifts to fill this board.
          </p>
        ) : (
          <ul className="glass divide-y divide-border/60 rounded-2xl">
            {rest.map((entry, i) => (
              <li key={entry.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-5 text-center text-sm font-bold text-muted-foreground">
                  {i + 4}
                </span>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.avatar ?? undefined} alt={entry.name} />
                  <AvatarFallback>{initials(entry.name)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm font-semibold">{entry.name}</span>
                <span className="text-right text-sm">
                  <span className="block font-bold">{entry.score.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{active.metric}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
