import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/rooms";
import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Moments, Families & People Nearby" },
      {
        name: "description",
        content:
          "Discover moments from the community, browse families and find people who are live in voice rooms right now.",
      },
      { property: "og:title", content: "Discover — Moments, Families & People Nearby" },
      {
        property: "og:description",
        content: "Find live people, families and community moments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { user } = useAuth();

  const { data: live = [], isLoading } = useQuery({
    queryKey: ["discover-live"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_seats")
        .select("user_id, rooms:room_id(id, name), profiles:user_id(id, display_name, avatar_url)")
        .not("user_id", "is", null)
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as {
        rooms: { id: string; name: string } | null;
        profiles: { id: string; display_name: string; avatar_url: string | null } | null;
      }[];
    },
    refetchInterval: 15000,
  });

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <div className="mx-auto max-w-lg px-4 pt-5">
        <h1 className="text-3xl font-black tracking-tight">Discover</h1>

        <Link
          to="/games"
          className="glass mt-4 flex items-center gap-3 rounded-2xl px-4 py-3"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full gold-gradient text-lg">
            🌈
          </span>
          <span className="flex-1 font-semibold">Moments</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm font-medium">
          {[
            { label: "church", emoji: "⛪", tint: "from-accent/40 to-gold/40" },
            { label: "family", emoji: "🏵️", tint: "from-gold/40 to-accent/35" },
            { label: "nearby", emoji: "📍", tint: "from-chart-5/35 to-chart-4/35" },
          ].map((tile) => (
            <div key={tile.label} className="glass rounded-2xl py-4">
              <span
                className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tile.tint} text-xl`}
              >
                {tile.emoji}
              </span>
              <span className="mt-2 block">{tile.label}</span>
            </div>
          ))}
        </div>

        <h2 className="mt-7 text-lg font-bold">They're playing</h2>
        {isLoading ? (
          <div className="grid place-items-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : live.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            Nobody is on a mic seat right now. Start a room and be first!
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {live.map((row, i) =>
              row.profiles ? (
                <li key={`${row.profiles.id}-${i}`} className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={row.profiles.avatar_url ?? undefined} alt={row.profiles.display_name} />
                    <AvatarFallback>{initials(row.profiles.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{row.profiles.display_name}</p>
                    <Badge variant="secondary" className="mt-0.5 rounded-full text-[11px]">
                      {row.rooms?.name ?? "Voice Room"}
                    </Badge>
                  </div>
                  {row.rooms ? (
                    <Link
                      to="/room/$roomId"
                      params={{ roomId: row.rooms.id }}
                      className="rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary"
                    >
                      Join
                    </Link>
                  ) : null}
                </li>
              ) : null,
            )}
          </ul>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
