import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Activity, Armchair, Clock, Loader2, Radio, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — WeVoice" },
      { name: "description", content: "WeVoice live stats: active rooms, peak users, session length and seat utilization." },
      { property: "og:title", content: "Analytics — WeVoice" },
      { property: "og:description", content: "WeVoice live stats: active rooms, peak users, session length and seat utilization." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsPage,
});

type SessionRow = { joined_at: string; left_at: string | null; room_id: string; user_id: string };

function AnalyticsPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [rooms, seats, sessions] = await Promise.all([
        supabase.from("rooms").select("id, seat_count, is_live").eq("is_live", true),
        supabase.from("room_seats").select("room_id, user_id"),
        supabase.from("voice_sessions").select("joined_at, left_at, room_id, user_id").gte("joined_at", since),
      ]);
      if (rooms.error) throw rooms.error;
      if (seats.error) throw seats.error;
      if (sessions.error) throw sessions.error;

      const liveRooms = rooms.data ?? [];
      const liveIds = new Set(liveRooms.map((r) => r.id));
      const liveSeats = (seats.data ?? []).filter((s) => liveIds.has(s.room_id));
      const occupied = liveSeats.filter((s) => s.user_id).length;
      const totalSeats = liveRooms.reduce((a, r) => a + r.seat_count, 0);

      const rows = (sessions.data ?? []) as SessionRow[];

      // average session length (completed sessions in last 24h)
      const done = rows.filter((s) => s.left_at);
      const avgMin = done.length
        ? Math.round(
            done.reduce(
              (a, s) => a + (new Date(s.left_at!).getTime() - new Date(s.joined_at).getTime()),
              0,
            ) /
              done.length /
              60000,
          )
        : 0;

      // peak concurrent users in last 24h via sweep line
      const events: { t: number; d: number }[] = [];
      for (const s of rows) {
        events.push({ t: new Date(s.joined_at).getTime(), d: 1 });
        if (s.left_at) events.push({ t: new Date(s.left_at).getTime(), d: -1 });
      }
      events.sort((a, b) => a.t - b.t || a.d - b.d);
      let cur = 0;
      let peak = 0;
      for (const e of events) {
        cur += e.d;
        peak = Math.max(peak, cur);
      }

      const activeNow = rows.filter((s) => !s.left_at).length;

      return {
        liveRooms: liveRooms.length,
        activeNow,
        peak24h: peak,
        avgSessionMin: avgMin,
        seatUtil: totalSeats > 0 ? Math.round((occupied / totalSeats) * 100) : 0,
        occupied,
        totalSeats,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    { icon: Radio, label: "Active rooms", value: data.liveRooms, hint: "Live now" },
    { icon: Users, label: "On mic now", value: data.activeNow, hint: "Active voice sessions" },
    { icon: Activity, label: "Peak users (24h)", value: data.peak24h, hint: "Max concurrent" },
    { icon: Clock, label: "Avg session", value: `${data.avgSessionMin} min`, hint: "Last 24h" },
    {
      icon: Armchair,
      label: "Seat utilization",
      value: `${data.seatUtil}%`,
      hint: `${data.occupied}/${data.totalSeats} seats occupied`,
    },
  ];

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <header className="glass sticky top-0 z-20 flex items-center gap-3 px-4 py-3">
        <Button size="icon" variant="ghost" asChild aria-label="Back">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <p className="font-bold">Analytics</p>
        <span className="ml-auto text-xs text-muted-foreground">Auto-refresh 15s</span>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pt-8">
        <h1 className="text-2xl font-black tracking-tight">Live overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rooms, users aur seat usage ki real-time jhalak.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="glass rounded-3xl p-5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
                <c.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-3xl font-black tracking-tight">{c.value}</p>
              <p className="mt-1 text-sm font-semibold">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.hint}</p>
            </div>
          ))}
          <div className="glass flex flex-col justify-center rounded-3xl p-5">
            <p className="text-sm font-semibold">Seat utilization</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${data.seatUtil}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {data.occupied} of {data.totalSeats} mic seats in use
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
