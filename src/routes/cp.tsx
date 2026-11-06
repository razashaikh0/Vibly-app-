import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Gem, HelpCircle, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/rooms";
import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/cp")({
  head: () => ({
    meta: [
      { title: "My Home — CP Partner & Guard Points" },
      {
        name: "description",
        content:
          "Pair up with your CP partner, protect friends and grow Guard Points together in WeVoice.",
      },
      { property: "og:title", content: "My Home — CP Partner & Guard Points" },
      {
        property: "og:description",
        content: "Find a CP partner, protect friends and climb the guard board.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CpPage,
});

const CP_THRESHOLD = 3000;
const PROTECT_POINTS = 100;

function CpPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: people = [], isLoading } = useQuery({
    queryKey: ["cp-suggestions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, coins")
        .neq("id", user!.id)
        .order("coins", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: guards = [] } = useQuery({
    queryKey: ["guard-relations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guard_relations")
        .select("target_id, points, is_cp")
        .eq("guardian_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: rings = [] } = useQuery({
    queryKey: ["ring-inventory", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ring_inventory")
        .select("id, ring_id, relationship_rings(name, emoji)")
        .eq("owner_id", user!.id)
        .is("used_at", null)
        .order("purchased_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["wedding-proposals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relationship_proposals")
        .select(
          "id, proposer_id, message, created_at, profiles:proposer_id(display_name, avatar_url), relationship_rings(name, emoji)",
        )
        .eq("recipient_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const guardMap = new Map(guards.map((g) => [g.target_id, g]));
  const top = guards.reduce<{ target_id: string; points: number; is_cp: boolean } | null>(
    (best, g) => (!best || g.points > best.points ? g : best),
    null,
  );
  const topProfile = top ? people.find((p) => p.id === top.target_id) : undefined;
  const topPoints = top?.points ?? 0;
  const cpProgress = Math.min(100, (topPoints / CP_THRESHOLD) * 100);
  const cpPartner = guards.find((g) => g.is_cp);
  const cpProfile = cpPartner ? people.find((p) => p.id === cpPartner.target_id) : undefined;

  const protect = useMutation({
    mutationFn: async (targetId: string) => {
      const { error } = await supabase.rpc("add_guard_points", {
        _target_id: targetId,
        _points: PROTECT_POINTS,
      });
      if (error) throw error;
      return targetId;
    },
    onSuccess: (targetId) => {
      const name = people.find((p) => p.id === targetId)?.display_name ?? "Player";
      const next = (guardMap.get(targetId)?.points ?? 0) + PROTECT_POINTS;
      toast.success(`Protecting ${name}`, {
        description: `Guard Pts ${next}/${CP_THRESHOLD}`,
      });
      void queryClient.invalidateQueries({ queryKey: ["guard-relations", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["task-progress", user?.id] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not protect this player"),
  });

  const propose = useMutation({
    mutationFn: async ({ targetId, ringId }: { targetId: string; ringId: string }) => {
      const { error } = await supabase.rpc("send_relationship_proposal", {
        _recipient_id: targetId,
        _ring_id: ringId,
        _message: "Will you marry me in VoicePal?",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Wedding proposal sent!");
      void queryClient.invalidateQueries({ queryKey: ["ring-inventory", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["wedding-proposals", user?.id] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not propose a CP"),
  });

  const respond = useMutation({
    mutationFn: async ({ proposalId, accept }: { proposalId: string; accept: boolean }) => {
      const { data, error } = await supabase.rpc("respond_relationship_proposal", {
        _proposal_id: proposalId,
        _accept: accept,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (wedding) => {
      void queryClient.invalidateQueries({ queryKey: ["wedding-proposals", user?.id] });
      toast.success(wedding ? "Wedding accepted! Your hall is ready." : "Proposal declined");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not respond to proposal"),
  });

  const partner = cpProfile ?? topProfile;

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/25 to-transparent pb-10">
        <header className="mx-auto flex max-w-lg items-center gap-2 px-3 py-3">
          <Button size="icon" variant="ghost" asChild aria-label="Back">
            <Link to="/me">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="flex-1 text-lg font-bold">My Home</h1>
          <Button
            size="icon"
            variant="ghost"
            aria-label="How CP works"
            onClick={() =>
              toast.info(
                `Protect friends to earn Guard Pts. ${CP_THRESHOLD} Guard Pts with one player unlocks a CP proposal.`,
              )
            }
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </header>

        <div className="mx-auto flex max-w-lg items-center justify-center gap-5 py-6">
          <Avatar className="h-24 w-24 ring-2 ring-gold">
            <AvatarImage
              src={profile?.avatar_url ?? undefined}
              alt={profile?.display_name ?? "You"}
            />
            <AvatarFallback>{initials(profile?.display_name ?? "You")}</AvatarFallback>
          </Avatar>
          <span className="text-2xl">〰️</span>
          {partner ? (
            <div className="flex flex-col items-center gap-1">
              <Avatar className="h-24 w-24 ring-2 ring-gold">
                <AvatarImage src={partner.avatar_url ?? undefined} alt={partner.display_name} />
                <AvatarFallback>{initials(partner.display_name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold">
                {cpProfile ? "CP" : partner.display_name}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="grid h-24 w-24 place-items-center rounded-full bg-background/50 text-3xl font-black ring-2 ring-gold">
                ?
              </span>
              <span className="text-sm font-semibold">CP</span>
            </div>
          )}
        </div>

        <div className="mx-auto max-w-lg px-5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Guard Pts {topPoints.toLocaleString()}</span>
            <span>{CP_THRESHOLD.toLocaleString()}</span>
          </div>
          <Progress value={cpProgress} className="mt-1.5 h-2" />
        </div>

        <p className="mx-auto mt-4 max-w-lg rounded-2xl bg-background/60 px-4 py-3 text-center text-sm">
          {cpPartner
            ? `You and ${cpProfile?.display_name ?? "your partner"} are CP.`
            : topPoints >= CP_THRESHOLD
              ? `You have ${topPoints} Guard Pts with ${topProfile?.display_name ?? "a player"} — you can propose now.`
              : `You need ${(CP_THRESHOLD - topPoints).toLocaleString()} more Guard Pts to propose a CP.`}
        </p>

        {!cpPartner && top && topPoints >= CP_THRESHOLD ? (
          <div className="mx-auto mt-3 flex max-w-lg justify-center">
            <Button
              className="rounded-full px-8"
              disabled={propose.isPending}
              onClick={() => {
                const ring = rings[0];
                if (!ring) {
                  toast.error("Buy a ring from the Shop before proposing.");
                  return;
                }
                propose.mutate({ targetId: top.target_id, ringId: ring.id });
              }}
            >
              <Gem className="mr-1.5 h-4 w-4" /> Propose with ring
            </Button>
          </div>
        ) : null}
      </div>

      <section className="mx-auto max-w-lg px-5 py-5">
        <h2 className="text-lg font-bold">People you may like</h2>
        <p className="text-sm text-muted-foreground">
          Gain more Guard through &quot;Protect&quot; and &quot;Send Gift&quot;.
        </p>

        {isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {people.map((p) => {
              const rel = guardMap.get(p.id);
              const points = rel?.points ?? 0;
              return (
                <li key={p.id} className="flex items-center gap-3">
                  <Link to="/profile/$userId" params={{ userId: p.id }}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={p.avatar_url ?? undefined} alt={p.display_name} />
                      <AvatarFallback>{initials(p.display_name)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-semibold">
                      {p.display_name}
                      {rel?.is_cp ? <span className="text-xs text-primary">💞 CP</span> : null}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Guard: <span className="text-primary">{points.toLocaleString()}</span>
                      {points > 0 ? (
                        <span className="ml-1 text-xs">
                          ({Math.min(100, Math.round((points / CP_THRESHOLD) * 100))}%)
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={rel ? "secondary" : "default"}
                    className="rounded-full px-5"
                    disabled={protect.isPending}
                    onClick={() => protect.mutate(p.id)}
                  >
                    {rel ? (
                      <>
                        <ShieldCheck className="mr-1 h-4 w-4" /> Protecting
                      </>
                    ) : (
                      "Protect"
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {proposals.length ? (
        <section className="mx-auto max-w-lg px-5 pb-5">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm font-bold">Wedding proposals</p>
            <div className="mt-3 space-y-3">
              {proposals.map((proposal) => {
                const proposer = proposal.profiles as {
                  display_name: string;
                  avatar_url: string | null;
                } | null;
                const ring = proposal.relationship_rings as { name: string; emoji: string } | null;
                return (
                  <div
                    key={proposal.id}
                    className="flex items-center gap-3 rounded-xl bg-muted/50 p-3"
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={proposer?.avatar_url ?? undefined} />
                      <AvatarFallback>{initials(proposer?.display_name ?? "Love")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {proposer?.display_name ?? "Someone"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ring?.emoji ?? "💍"} {ring?.name ?? "Wedding ring"}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="h-8 px-2.5"
                        onClick={() => respond.mutate({ proposalId: proposal.id, accept: true })}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 px-2.5"
                        onClick={() => respond.mutate({ proposalId: proposal.id, accept: false })}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <BottomNav />
    </div>
  );
}
