import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Coins,
  Eye,
  Gift,
  Loader2,
  Mic,
  MessagesSquare,
  Save,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/rooms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SeatFrame, CharmBadge } from "@/components/SeatFrame";
import { charmProgress, frameTier, nextFrameTier, togetherLabel, daysSince } from "@/lib/levels";

export const Route = createFileRoute("/profile/$userId")({
  head: () => ({
    meta: [
      { title: "User profile — WeVoice" },
      { name: "description", content: "WeVoice member profile with voice stats, gifts and bio." },
      { property: "og:title", content: "User profile — WeVoice" },
      {
        property: "og:description",
        content: "WeVoice member profile with voice stats, gifts and bio.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { userId } = useParams({ from: "/profile/$userId" });
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const isSelf = user?.id === userId;
  const [bioDraft, setBioDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [following, setFollowing] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, coins, created_at")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const statsQuery = useQuery({
    queryKey: ["profile-stats", userId],
    queryFn: async () => {
      const [hosted, sent, received, sessions, messages] = await Promise.all([
        supabase.from("rooms").select("id", { count: "exact", head: true }).eq("host_id", userId),
        supabase
          .from("gift_events")
          .select("total_price.sum()", { head: false })
          .eq("sender_id", userId),
        supabase
          .from("gift_events")
          .select("total_price.sum()", { head: false })
          .eq("receiver_id", userId),
        supabase
          .from("voice_sessions")
          .select("joined_at, left_at")
          .eq("user_id", userId)
          .limit(500),
        supabase
          .from("room_messages")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);
      const voiceMins = Math.round(
        ((sessions.data ?? []) as { joined_at: string; left_at: string | null }[]).reduce(
          (acc, s) =>
            acc +
            ((s.left_at ? new Date(s.left_at).getTime() : Date.now()) -
              new Date(s.joined_at).getTime()),
          0,
        ) / 60000,
      );
      const sum = (rows: unknown) =>
        ((rows as { sum: number | null }[] | null)?.[0]?.sum ?? 0) as number;
      return {
        roomsHosted: hosted.count ?? 0,
        coinsSent: sum(sent.data),
        coinsReceived: sum(received.data),
        voiceMins,
        messages: messages.count ?? 0,
      };
    },
  });

  // CP / guardian timeline — "kitne din se" plus activity milestones
  const cpQuery = useQuery({
    queryKey: ["profile-cp", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("guard_relations")
        .select(
          "id, guardian_id, target_id, points, is_cp, created_at, profiles:target_id(display_name, avatar_url)",
        )
        .or(`guardian_id.eq.${userId},target_id.eq.${userId}`)
        .order("points", { ascending: false })
        .limit(1);
      return (data?.[0] ?? null) as {
        points: number;
        is_cp: boolean;
        created_at: string;
        profiles?: { display_name: string; avatar_url: string | null } | null;
      } | null;
    },
  });

  const followQuery = useQuery({
    queryKey: ["profile-follow", user?.id, userId],
    enabled: !!user && !isSelf,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_follows")
        .select("follower_id")
        .eq("follower_id", user!.id)
        .eq("following_id", userId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const visitorsQuery = useQuery({
    queryKey: ["profile-visitors", userId],
    enabled: !!user && isSelf,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_visits")
        .select("visited_at, visitor:visitor_id(id, display_name, avatar_url)")
        .eq("profile_id", userId)
        .order("visited_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user || isSelf) return;
    void supabase
      .from("profile_visits")
      .upsert(
        { visitor_id: user.id, profile_id: userId, visited_at: new Date().toISOString() },
        { onConflict: "visitor_id,profile_id" },
      );
  }, [isSelf, user, userId]);

  useEffect(() => {
    if (followQuery.data !== undefined) setFollowing(followQuery.data);
  }, [followQuery.data]);

  const toggleFollow = async () => {
    if (!user || isSelf) return;
    if (following) {
      const { error } = await supabase
        .from("profile_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);
      if (error) toast.error("Could not unfollow");
      else setFollowing(false);
    } else {
      const { error } = await supabase.from("profile_follows").insert({
        follower_id: user.id,
        following_id: userId,
      });
      if (error) toast.error("Could not follow");
      else setFollowing(true);
    }
  };

  useEffect(() => {
    if (isSelf) setBioDraft(null);
  }, [isSelf, userId]);

  const saveBio = async () => {
    if (!isSelf || bioDraft === null) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ bio: bioDraft }).eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not save bio");
      return;
    }
    toast.success("Bio save ho gayi");
    setBioDraft(null);
    await profileQuery.refetch();
    await refreshProfile();
  };

  if (profileQuery.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const p = isSelf && myProfile ? { ...profileQuery.data, ...myProfile } : profileQuery.data;
  if (!p) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="text-4xl">👤</p>
          <p className="mt-3 font-semibold">User not found</p>
          <Button asChild className="mt-4">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;
  const bioValue = bioDraft ?? p.bio ?? "";

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <header className="glass sticky top-0 z-20 flex items-center gap-3 px-4 py-3">
        <Button size="icon" variant="ghost" asChild aria-label="Back">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <p className="font-bold">Profile</p>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pt-8">
        <section className="glass rounded-3xl p-6 text-center">
          <div className="flex justify-center">
            <SeatFrame charm={p.coins ?? 0} size={108}>
              <Avatar className="h-[5.4rem] w-[5.4rem]">
                <AvatarImage src={p.avatar_url ?? undefined} />
                <AvatarFallback className="text-2xl">{initials(p.display_name)}</AvatarFallback>
              </Avatar>
            </SeatFrame>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight">{p.display_name}</h1>
          {p.username && <p className="text-sm text-muted-foreground">@{p.username}</p>}
          <div className="mt-2 flex items-center justify-center gap-2">
            <CharmBadge charm={p.coins ?? 0} />
            <span className="text-[11px] text-muted-foreground">
              {frameTier(p.coins ?? 0).title} · member for{" "}
              {togetherLabel(profileQuery.data?.created_at)}
            </span>
          </div>
          {!isSelf ? (
            <Button
              size="sm"
              variant={following ? "secondary" : "default"}
              className="mt-4 rounded-full"
              onClick={() => void toggleFollow()}
            >
              <UserPlus className="mr-1.5 h-4 w-4" /> {following ? "Following" : "Follow"}
            </Button>
          ) : null}

          {/* charm progress towards the next frame tier */}
          <div className="mx-auto mt-3 max-w-xs">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full royal-gradient"
                style={{ width: `${charmProgress(p.coins ?? 0)}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {nextFrameTier(p.coins ?? 0)
                ? `${(nextFrameTier(p.coins ?? 0)!.charm - (p.coins ?? 0)).toLocaleString()} charm to ${nextFrameTier(p.coins ?? 0)!.title}`
                : "Max charm tier reached"}
            </p>
          </div>

          <div className="mx-auto mt-5 max-w-md text-left">
            {isSelf ? (
              <>
                <Textarea
                  value={bioValue}
                  onChange={(e) => setBioDraft(e.target.value)}
                  placeholder="Write something about yourself..."
                  maxLength={200}
                  className="min-h-20"
                />
                {bioDraft !== null && bioDraft !== (p.bio ?? "") && (
                  <Button
                    size="sm"
                    className="mt-2 gap-2 rounded-full"
                    onClick={() => void saveBio()}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save bio
                  </Button>
                )}
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground">{p.bio || "No bio yet."}</p>
            )}
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { icon: Coins, label: "Coins", value: p.coins.toLocaleString(), gold: true },
            { icon: Mic, label: "Voice minutes", value: stats?.voiceMins ?? "…" },
            { icon: Gift, label: "Gifts received", value: `🪙 ${stats?.coinsReceived ?? "…"}` },
            { icon: Gift, label: "Gifts sent", value: `🪙 ${stats?.coinsSent ?? "…"}` },
            { icon: MessagesSquare, label: "Messages", value: stats?.messages ?? "…" },
            { icon: Mic, label: "Rooms hosted", value: stats?.roomsHosted ?? "…" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4">
              <s.icon className={`h-4 w-4 ${s.gold ? "text-gold" : "text-primary"}`} />
              <p className="mt-2 text-xl font-black">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </section>

        {cpQuery.data && (
          <section className="glass mt-4 rounded-2xl p-4">
            <p className="text-sm font-bold">CP & guardian timeline</p>
            <div className="mt-2 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={cpQuery.data.profiles?.avatar_url ?? undefined} />
                <AvatarFallback>
                  {initials(cpQuery.data.profiles?.display_name ?? "CP")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {cpQuery.data.profiles?.display_name ?? "Partner"}
                  {cpQuery.data.is_cp ? " 💞" : ""}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Together for {togetherLabel(cpQuery.data.created_at)} ·{" "}
                  {daysSince(cpQuery.data.created_at)} days · {cpQuery.data.points.toLocaleString()}{" "}
                  guard pts
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {[
                { at: 7, label: "1 week together" },
                { at: 30, label: "1 month together" },
                { at: 100, label: "100 days badge" },
                { at: 365, label: "Anniversary frame" },
              ].map((m) => {
                const done = daysSince(cpQuery.data!.created_at) >= m.at;
                return (
                  <div key={m.at} className="flex items-center justify-between text-[11px]">
                    <span className={done ? "font-semibold" : "text-muted-foreground"}>
                      {m.label}
                    </span>
                    <span className={done ? "text-primary" : "text-muted-foreground"}>
                      {done
                        ? "Unlocked"
                        : `${m.at - daysSince(cpQuery.data!.created_at)} days left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {isSelf ? (
          <section className="glass mt-4 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold">Profile visitors</p>
            </div>
            {visitorsQuery.data?.length ? (
              <div className="mt-3 flex gap-3 overflow-x-auto">
                {visitorsQuery.data.map((visit) => {
                  const visitor = visit.visitor as {
                    id: string;
                    display_name: string;
                    avatar_url: string | null;
                  } | null;
                  return visitor ? (
                    <Link
                      key={visitor.id}
                      to="/profile/$userId"
                      params={{ userId: visitor.id }}
                      className="w-14 shrink-0 text-center"
                    >
                      <Avatar className="mx-auto h-10 w-10">
                        <AvatarImage src={visitor.avatar_url ?? undefined} />
                        <AvatarFallback>{initials(visitor.display_name)}</AvatarFallback>
                      </Avatar>
                      <span className="mt-1 block truncate text-[10px]">
                        {visitor.display_name}
                      </span>
                    </Link>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No visitors yet.</p>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
