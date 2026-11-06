import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Crown, Gift, Heart, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/rooms";

export const Route = createFileRoute("/wedding")({
  head: () => ({
    meta: [
      { title: "Wedding Hall — VoicePal" },
      {
        name: "description",
        content: "Celebrate your VoicePal wedding with a live couple hall and wedding gifts.",
      },
    ],
  }),
  component: WeddingPage,
});

function WeddingPage() {
  const { user } = useAuth();
  const weddingQuery = useQuery({
    queryKey: ["my-wedding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weddings")
        .select(
          "*, partner_one:partner_one_id(id, display_name, avatar_url), partner_two:partner_two_id(id, display_name, avatar_url), relationship_rings(name, emoji)",
        )
        .eq("status", "active")
        .or(`partner_one_id.eq.${user!.id},partner_two_id.eq.${user!.id}`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const giftsQuery = useQuery({
    queryKey: ["wedding-gifts"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gifts")
        .select("id, name, emoji, price, tier")
        .order("price")
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });
  const eventsQuery = useQuery({
    queryKey: ["wedding-gift-events", weddingQuery.data?.id],
    enabled: !!weddingQuery.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_gift_events")
        .select(
          "id, sender_id, quantity, total_price, created_at, gifts:gift_id(name, emoji), profiles:sender_id(display_name)",
        )
        .eq("wedding_id", weddingQuery.data!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const wedding = weddingQuery.data as
    | {
        id: string;
        wedding_date: string;
        partner_one: { id: string; display_name: string; avatar_url: string | null } | null;
        partner_two: { id: string; display_name: string; avatar_url: string | null } | null;
        relationship_rings: { name: string; emoji: string } | null;
      }
    | null
    | undefined;
  const partner =
    wedding?.partner_one?.id === user?.id ? wedding?.partner_two : wedding?.partner_one;
  const me = wedding?.partner_one?.id === user?.id ? wedding?.partner_one : wedding?.partner_two;

  const sendGift = async (giftId: string, name: string) => {
    if (!wedding) return;
    const { error } = await supabase.rpc("send_wedding_gift", {
      _wedding_id: wedding.id,
      _gift_id: giftId,
      _quantity: 1,
    });
    if (error) toast.error(error.message.includes("coins") ? "Not enough coins" : error.message);
    else {
      toast.success(`${name} sent in the wedding hall`);
      void eventsQuery.refetch();
    }
  };

  if (!wedding && !weddingQuery.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <Heart className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 text-xl font-black">Your wedding hall is waiting</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Buy a ring, reach your partner and send a real proposal from My Home.
          </p>
          <Button className="mt-5 rounded-full" asChild>
            <Link to="/cp">Open My Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <header className="glass sticky top-0 z-20 flex items-center gap-2 px-3 py-3">
        <Button size="icon" variant="ghost" asChild>
          <Link to="/me">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold">Wedding Hall</h1>
        <Crown className="h-5 w-5 text-gold" />
      </header>
      <main className="mx-auto max-w-lg px-4 py-4">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/25 via-accent/15 to-gold/20 p-5 text-center shadow-[var(--shadow-elevated)]">
          <span className="absolute left-8 top-5 animate-pulse text-xl">✦</span>
          <span className="absolute right-10 top-12 animate-bounce text-lg">✧</span>
          <span className="absolute bottom-10 left-12 animate-pulse text-lg">✦</span>
          <span className="absolute bottom-8 right-8 animate-bounce text-xl">✧</span>
          <p className="text-eyebrow text-primary">OFFICIAL WEDDING HALL</p>
          <div className="mt-5 flex items-center justify-center gap-5">
            <div>
              <Avatar className="mx-auto h-20 w-20 ring-4 ring-gold/70">
                <AvatarImage src={me?.avatar_url ?? undefined} />
                <AvatarFallback>{initials(me?.display_name ?? "You")}</AvatarFallback>
              </Avatar>
              <p className="mt-2 text-sm font-bold">{me?.display_name ?? "You"}</p>
            </div>
            <div className="text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-background/70 text-2xl shadow-lg">
                {wedding?.relationship_rings?.emoji ?? "💍"}
              </div>
              <Heart className="mx-auto mt-2 h-4 w-4 fill-primary text-primary" />
            </div>
            <div>
              <Avatar className="mx-auto h-20 w-20 ring-4 ring-gold/70">
                <AvatarImage src={partner?.avatar_url ?? undefined} />
                <AvatarFallback>{initials(partner?.display_name ?? "Partner")}</AvatarFallback>
              </Avatar>
              <p className="mt-2 text-sm font-bold">{partner?.display_name ?? "Partner"}</p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-background/50 px-4 py-3 text-left">
            <p className="flex items-center gap-2 text-xs font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" /> Married{" "}
              {new Date(wedding?.wedding_date ?? Date.now()).toLocaleDateString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {wedding?.relationship_rings?.name ?? "Wedding ring"} · your couple hall is live
            </p>
          </div>
        </section>

        <section className="surface-card mt-4 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Wedding gifts</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Send a gift to celebrate the couple. Coins are charged securely.
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {(giftsQuery.data ?? []).slice(0, 8).map((gift) => (
              <button
                key={gift.id}
                type="button"
                onClick={() => void sendGift(gift.id, gift.name)}
                className="rounded-xl bg-muted/60 p-2 text-center transition hover:bg-primary/15"
              >
                <span className="text-xl">{gift.emoji}</span>
                <span className="mt-1 block truncate text-[10px] font-semibold">{gift.name}</span>
                <span className="block text-[10px] text-gold">{gift.price}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="surface-card mt-4 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-bold">Wedding gift wall</h2>
          </div>
          {eventsQuery.data?.length ? (
            <div className="mt-3 space-y-2">
              {eventsQuery.data.map((event) => {
                const gift = event.gifts as { name: string; emoji: string } | null;
                const sender = event.profiles as { display_name: string } | null;
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs"
                  >
                    <span className="text-xl">{gift?.emoji ?? "🎁"}</span>
                    <span className="flex-1">
                      <b>{sender?.display_name ?? "Someone"}</b> sent {gift?.name ?? "a gift"}
                    </span>
                    <span className="text-gold">{event.total_price}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Your first wedding gift will appear here with an animation.
            </p>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
