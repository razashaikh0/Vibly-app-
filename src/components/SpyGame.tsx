import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Eye, EyeOff, Vote, Play, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Session = {
  id: string;
  room_id: string;
  host_id: string;
  phase: "lobby" | "describe" | "vote" | "ended";
  round: number;
  civilian_word: string | null;
  spy_word: string | null;
  winner: string | null;
};

type Player = {
  id: string;
  session_id: string;
  user_id: string;
  role: string | null;
  word: string | null;
  is_alive: boolean;
  eliminated_round: number | null;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
};

type VoteRow = { voter_id: string; target_id: string; round: number };

// new tables are not in the generated types yet
const db = supabase as unknown as {
  from: (t: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
  channel: typeof supabase.channel;
  removeChannel: typeof supabase.removeChannel;
};

export function SpyGame({ roomId, userId }: { roomId: string; userId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showWord, setShowWord] = useState(false);

  const load = useCallback(async () => {
    const { data: s } = await db
      .from("game_sessions")
      .select("*")
      .eq("room_id", roomId)
      .neq("phase", "ended")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSession((s as Session) ?? null);
    if (!s) {
      setPlayers([]);
      setVotes([]);
      setLoading(false);
      return;
    }
    const [{ data: p }, { data: v }] = await Promise.all([
      db
        .from("game_players")
        .select("*, profiles(display_name, avatar_url)")
        .eq("session_id", s.id)
        .order("joined_at"),
      db.from("game_votes").select("voter_id, target_id, round").eq("session_id", s.id),
    ]);
    setPlayers((p as Player[]) ?? []);
    setVotes((v as VoteRow[]) ?? []);
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`spy:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_sessions" }, () => {
        void load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "game_players" }, () => {
        void load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "game_votes" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, load]);

  const me = useMemo(() => players.find((p) => p.user_id === userId), [players, userId]);
  const isHost = session?.host_id === userId;
  const alive = players.filter((p) => p.is_alive);
  const myVote = votes.find((v) => v.voter_id === userId && v.round === session?.round);

  const run = async (fn: string, args: Record<string, unknown>, ok?: string) => {
    setBusy(true);
    const { error } = await db.rpc(fn, args);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (ok) toast.success(ok);
    void load();
  };

  const name = (p: Player) => p.profiles?.display_name ?? "Player";

  if (loading) {
    return (
      <div className="grid h-40 place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          Everyone gets a secret word — one player gets a different one. Describe your word out
          loud, then vote out the spy.
        </p>
        <Button
          className="w-full"
          disabled={busy}
          onClick={() => run("open_game_session", { _room_id: roomId }, "Game table opened")}
        >
          Open game table
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="rounded-full">
          {session.phase === "lobby"
            ? "Waiting for players"
            : session.phase === "ended"
              ? "Finished"
              : `Round ${session.round} — ${session.phase === "vote" ? "Voting" : "Describe"}`}
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground">{players.length} players</span>
      </div>

      {me && session.phase !== "lobby" && session.phase !== "ended" ? (
        <button
          type="button"
          onClick={() => setShowWord((s) => !s)}
          className="flex w-full items-center justify-between rounded-2xl bg-secondary px-4 py-3 text-left"
        >
          <span>
            <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
              Your secret word
            </span>
            <span className="text-lg font-bold">{showWord ? (me.word ?? "—") : "••••••"}</span>
          </span>
          {showWord ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      ) : null}

      {session.phase === "ended" ? (
        <div className="rounded-2xl bg-secondary p-4 text-center">
          <Trophy className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-1 text-base font-bold">
            {session.winner === "spy" ? "The spy wins!" : "Civilians win!"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Word: {session.civilian_word} · Spy word: {session.spy_word}
          </p>
        </div>
      ) : null}

      <ul className="space-y-2">
        {players.map((p) => {
          const count = votes.filter(
            (v) => v.target_id === p.user_id && v.round === session.round,
          ).length;
          const canVote =
            session.phase === "vote" && !!me?.is_alive && p.is_alive && p.user_id !== userId;
          return (
            <li
              key={p.id}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${
                p.is_alive ? "border-border" : "border-transparent bg-muted/50 opacity-60"
              }`}
            >
              <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-primary/15 text-xs font-bold">
                {p.profiles?.avatar_url ? (
                  <img src={p.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  name(p).slice(0, 1).toUpperCase()
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {name(p)}
                {p.user_id === userId ? " (you)" : ""}
                {session.phase === "ended" && p.role === "spy" ? (
                  <Badge className="ml-2 rounded-full">Spy</Badge>
                ) : null}
              </span>
              {session.phase === "vote" && count > 0 ? (
                <span className="text-xs text-muted-foreground">{count} votes</span>
              ) : null}
              {canVote ? (
                <Button
                  size="sm"
                  variant={myVote?.target_id === p.user_id ? "default" : "secondary"}
                  disabled={busy}
                  onClick={() =>
                    run("cast_game_vote", { _session_id: session.id, _target_id: p.user_id })
                  }
                >
                  <Vote className="mr-1 h-3.5 w-3.5" /> Vote
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2">
        {!me ? (
          <Button
            className="flex-1"
            disabled={busy}
            onClick={() => run("open_game_session", { _room_id: roomId }, "Joined the game")}
          >
            Join game
          </Button>
        ) : null}
        {isHost && session.phase === "lobby" ? (
          <Button
            className="flex-1"
            disabled={busy || players.length < 3}
            onClick={() => run("start_game_session", { _session_id: session.id }, "Game started")}
          >
            <Play className="mr-1 h-4 w-4" />
            {players.length < 3 ? "Need 3 players" : "Start game"}
          </Button>
        ) : null}
        {isHost && session.phase === "describe" ? (
          <Button
            className="flex-1"
            disabled={busy}
            onClick={() => run("set_game_phase", { _session_id: session.id, _phase: "vote" })}
          >
            Start voting
          </Button>
        ) : null}
        {isHost && session.phase !== "ended" ? (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => run("set_game_phase", { _session_id: session.id, _phase: "ended" })}
          >
            End
          </Button>
        ) : null}
        {session.phase === "ended" ? (
          <Button
            className="flex-1"
            disabled={busy}
            onClick={() => run("open_game_session", { _room_id: roomId }, "New table opened")}
          >
            Play again
          </Button>
        ) : null}
      </div>

      {alive.length > 0 && session.phase === "vote" ? (
        <p className="text-center text-xs text-muted-foreground">
          {votes.filter((v) => v.round === session.round).length}/{alive.length} votes in
        </p>
      ) : null}
    </div>
  );
}
