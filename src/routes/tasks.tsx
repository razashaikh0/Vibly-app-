import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Daily Rewards, Growth & Family Bonus" },
      {
        name: "description",
        content:
          "Complete daily tasks, growth milestones and family goals to earn coins, activeness and chest rewards.",
      },
      { property: "og:title", content: "Tasks — Daily Rewards & Growth Milestones" },
      {
        property: "og:description",
        content: "Daily logins, game rounds and gifting goals that pay out coins and chests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksPage,
});

type Tab = "daily" | "growth" | "family";

type Progress = {
  sessionsToday: number;
  sessionsTotal: number;
  seatsTaken: number;
  giftsToday: number;
  giftsTotal: number;
  giftsReceived: number;
  messagesToday: number;
  roomsToday: number;
  guardMax: number;
  guardTotal: number;
};

type Task = {
  key: string;
  title: string;
  desc: string;
  activeness: number;
  coins: number;
  goto: "/" | "/games" | "/cp" | "/discover";
  done: (p: Progress) => boolean;
  progress?: (p: Progress) => string;
};

const startOfUtcDay = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
};

const TASKS: Record<Tab, Task[]> = {
  daily: [
    { key: "daily_login", title: "Daily Login", desc: "Log in to WeVoice today.", activeness: 5, coins: 5, goto: "/", done: () => true },
    { key: "daily_join_room", title: "Join a voice room", desc: "Enter any live room once.", activeness: 5, coins: 5, goto: "/", done: (p) => p.sessionsToday > 0, progress: (p) => `${Math.min(p.sessionsToday, 1)}/1` },
    { key: "daily_take_seat", title: "Take a mic seat", desc: "Sit on any mic seat.", activeness: 5, coins: 5, goto: "/", done: (p) => p.seatsTaken > 0, progress: (p) => `${Math.min(p.seatsTaken, 1)}/1` },
    { key: "daily_send_gift", title: "Send 1 gift", desc: "Send any gift in a room.", activeness: 10, coins: 10, goto: "/", done: (p) => p.giftsToday > 0, progress: (p) => `${Math.min(p.giftsToday, 1)}/1` },
    { key: "daily_chat", title: "Say hi in chat", desc: "Post 3 messages in room chat.", activeness: 5, coins: 5, goto: "/", done: (p) => p.messagesToday >= 3, progress: (p) => `${Math.min(p.messagesToday, 3)}/3` },
    { key: "daily_host", title: "Host a room", desc: "Create your own voice room today.", activeness: 10, coins: 10, goto: "/", done: (p) => p.roomsToday > 0, progress: (p) => `${Math.min(p.roomsToday, 1)}/1` },
  ],
  growth: [
    { key: "growth_first_join", title: "First Attempt", desc: "Join a voice room for the first time.", activeness: 0, coins: 10, goto: "/", done: (p) => p.sessionsTotal > 0 },
    { key: "growth_first_seat", title: "New Challenger", desc: "Take a mic seat for the first time.", activeness: 0, coins: 10, goto: "/", done: (p) => p.seatsTaken > 0 },
    { key: "growth_first_gift_sent", title: "Generous Start", desc: "Send your first gift.", activeness: 0, coins: 15, goto: "/", done: (p) => p.giftsTotal > 0 },
    { key: "growth_first_like", title: "First Like", desc: "Receive your first gift.", activeness: 0, coins: 15, goto: "/", done: (p) => p.giftsReceived > 0 },
    { key: "growth_good_friend", title: "Good Friend", desc: "Reach 1000 Guard Pts with a player.", activeness: 0, coins: 50, goto: "/cp", done: (p) => p.guardMax >= 1000, progress: (p) => `${Math.min(p.guardMax, 1000)}/1000` },
    { key: "growth_close_friend", title: "Close Friend", desc: "Reach 2000 Guard Pts with a player.", activeness: 0, coins: 100, goto: "/cp", done: (p) => p.guardMax >= 2000, progress: (p) => `${Math.min(p.guardMax, 2000)}/2000` },
    { key: "growth_best_friend", title: "Best Friend", desc: "Reach 3000 Guard Pts with a player.", activeness: 0, coins: 150, goto: "/cp", done: (p) => p.guardMax >= 3000, progress: (p) => `${Math.min(p.guardMax, 3000)}/3000` },
  ],
  family: [
    { key: "family_protect", title: "Family Hope", desc: "Protect a family member today.", activeness: 5, coins: 5, goto: "/cp", done: (p) => p.guardTotal > 0, progress: (p) => `${Math.min(p.guardTotal, 1)}/1` },
    { key: "family_activeness", title: "Family Activeness", desc: "Send a gift to a family member.", activeness: 5, coins: 5, goto: "/", done: (p) => p.giftsToday > 0, progress: (p) => `${Math.min(p.giftsToday, 1)}/1` },
    { key: "family_task", title: "Family Task", desc: "Chat 10 times with your family today.", activeness: 10, coins: 20, goto: "/", done: (p) => p.messagesToday >= 10, progress: (p) => `${Math.min(p.messagesToday, 10)}/10` },
    { key: "family_chest", title: "Family Treasure Chest", desc: "Join a room with your family today.", activeness: 5, coins: 10, goto: "/", done: (p) => p.sessionsToday > 0, progress: (p) => `${Math.min(p.sessionsToday, 1)}/1` },
  ],
};

const TAB_THEME: Record<Tab, string> = {
  daily: "from-chart-5/35 to-transparent",
  growth: "from-primary/25 to-transparent",
  family: "from-chart-4/35 to-transparent",
};

const CHESTS = [10, 40, 70, 100];

function TasksPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("daily");
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ["task-progress", user?.id],
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    queryFn: async (): Promise<Progress> => {
      const uid = user!.id;
      const since = startOfUtcDay();
      const count = { count: "exact" as const, head: true };

      const [
        sessionsToday,
        sessionsTotal,
        seats,
        giftsToday,
        giftsTotal,
        giftsReceived,
        messagesToday,
        roomsToday,
        guards,
      ] = await Promise.all([
        supabase.from("voice_sessions").select("id", count).eq("user_id", uid).gte("joined_at", since),
        supabase.from("voice_sessions").select("id", count).eq("user_id", uid),
        supabase.from("room_seats").select("id", count).eq("user_id", uid),
        supabase.from("gift_events").select("id", count).eq("sender_id", uid).gte("created_at", since),
        supabase.from("gift_events").select("id", count).eq("sender_id", uid),
        supabase.from("gift_events").select("id", count).eq("receiver_id", uid),
        supabase.from("room_messages").select("id", count).eq("user_id", uid).gte("created_at", since),
        supabase.from("rooms").select("id", count).eq("host_id", uid).gte("created_at", since),
        supabase.from("guard_relations").select("points").eq("guardian_id", uid),
      ]);

      const points = (guards.data ?? []).map((g) => g.points);

      return {
        sessionsToday: sessionsToday.count ?? 0,
        sessionsTotal: sessionsTotal.count ?? 0,
        seatsTaken: seats.count ?? 0,
        giftsToday: giftsToday.count ?? 0,
        giftsTotal: giftsTotal.count ?? 0,
        giftsReceived: giftsReceived.count ?? 0,
        messagesToday: messagesToday.count ?? 0,
        roomsToday: roomsToday.count ?? 0,
        guardMax: points.length ? Math.max(...points) : 0,
        guardTotal: points.reduce((a, b) => a + b, 0),
      };
    },
  });

  const { data: claims = [] } = useQuery({
    queryKey: ["task-claims", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_claims")
        .select("task_key, category, activeness, claim_day")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const claimedKeys = useMemo(
    () =>
      new Set(
        claims
          .filter((c) => c.category !== "daily" || c.claim_day === today)
          .map((c) => c.task_key),
      ),
    [claims, today],
  );

  const activeness = useMemo(
    () =>
      Math.min(
        100,
        claims
          .filter((c) => c.claim_day === today)
          .reduce((sum, c) => sum + (c.activeness ?? 0), 0),
      ),
    [claims, today],
  );

  const claimMutation = useMutation({
    mutationFn: async (task: Task) => {
      const { error } = await supabase.rpc("claim_task", {
        _task_key: task.key,
        _category: tab,
        _activeness: task.activeness,
        _coins: task.coins,
      });
      if (error) throw error;
      return task;
    },
    onSuccess: (task) => {
      toast.success(`${task.title} claimed!`, {
        description: `+${task.coins} coins${task.activeness ? ` · +${task.activeness} activeness` : ""}`,
      });
      void queryClient.invalidateQueries({ queryKey: ["task-claims", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["task-progress", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : "Could not claim this task";
      toast.error(message.includes("duplicate") ? "Already claimed today" : message);
    },
  });

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <div className={`bg-gradient-to-r ${TAB_THEME[tab]} pb-8`}>
        <header className="mx-auto flex max-w-lg items-center gap-1 px-3 py-3">
          <Button size="icon" variant="ghost" asChild aria-label="Back">
            <Link to="/games">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          {(["daily", "growth", "family"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`flex-1 text-lg font-bold capitalize transition-opacity ${
                tab === t ? "opacity-100 underline underline-offset-8" : "opacity-60"
              }`}
            >
              {t}
            </button>
          ))}
        </header>

        <div className="mx-auto max-w-lg px-5">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Today&apos;s Activeness {activeness}</span>
            <span className="opacity-80">Refresh at 00:00 UTC</span>
          </div>
          <div className="relative mt-6 h-1.5 rounded-full bg-background/50">
            <div
              className="h-1.5 rounded-full bg-background transition-all duration-500"
              style={{ width: `${activeness}%` }}
            />
            <div className="absolute inset-x-0 -top-5 flex justify-between">
              {CHESTS.map((c) => (
                <div key={c} className="flex flex-col items-center">
                  <span className={`text-2xl ${activeness >= c ? "" : "opacity-50 grayscale"}`}>
                    🧰
                  </span>
                  <span className="text-[11px] font-semibold">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoading || !progress ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <ul className="mx-auto max-w-lg divide-y divide-border/70 px-5">
          {TASKS[tab].map((task) => {
            const claimed = claimedKeys.has(task.key);
            const ready = task.done(progress);
            return (
              <li key={task.key} className="flex items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {task.title}
                    {task.progress ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({task.progress(progress)})
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{task.desc}</p>
                  <div className="mt-1 flex gap-3 text-xs font-medium">
                    <span className="flex items-center gap-1">
                      <span className="text-base">🪙</span>x{task.coins}
                    </span>
                    {task.activeness ? (
                      <span className="flex items-center gap-1">
                        <span className="text-base">❤️</span>x{task.activeness}
                      </span>
                    ) : null}
                  </div>
                </div>
                {claimed ? (
                  <Button size="sm" disabled className="rounded-full px-6">
                    Done
                  </Button>
                ) : ready ? (
                  <Button
                    size="sm"
                    disabled={claimMutation.isPending}
                    onClick={() => claimMutation.mutate(task)}
                    className="rounded-full bg-gold px-6 text-foreground hover:bg-gold/90"
                  >
                    Claim
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" asChild className="rounded-full px-6">
                    <Link to={task.goto}>Go</Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <BottomNav />
    </div>
  );
}
