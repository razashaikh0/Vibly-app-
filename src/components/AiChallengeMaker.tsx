import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Wand2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { generateChallenge, type Challenge } from "@/lib/challenge.functions";

const IDEAS = ["Bollywood dialogue battle", "Mehndi night quiz", "Guess the song in 5 words", "Funny roast round"];

export function AiChallengeMaker({ roomId, userId, isHost }: { roomId: string; userId: string; isHost: boolean }) {
  const gen = useServerFn(generateChallenge);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  if (!isHost) {
    return <p className="text-sm text-muted-foreground">Only the room host can create AI challenges.</p>;
  }

  const create = async () => {
    if (prompt.trim().length < 3) return;
    setBusy(true);
    setError(null);
    setChallenge(null);
    try {
      const res = await gen({ data: { roomId, prompt } });
      if (res.error) setError(res.error);
      else if (res.challenge) setChallenge(res.challenge);
    } catch {
      setError("Could not create the challenge. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const post = async () => {
    if (!challenge) return;
    const text =
      `🎯 ${challenge.title}\n${challenge.intro}\n\nRules:\n${challenge.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}` +
      `\n\n${challenge.rounds.map((r, i) => `Round ${i + 1} — ${r.name}: ${r.task}`).join("\n")}` +
      `\n\nScoring: ${challenge.scoring}\nWinner: ${challenge.winner}`;
    const { error: e } = await supabase
      .from("room_messages")
      .insert({ room_id: roomId, user_id: userId, content: text.slice(0, 1900), kind: "text" });
    if (e) toast.error("Could not post to the room");
    else toast.success("Challenge posted to room chat");
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={prompt}
        maxLength={400}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Write a theme or challenge, e.g. 'Wedding night antakshari with a twist'"
        rows={3}
      />
      <div className="flex flex-wrap gap-1.5">
        {IDEAS.map((i) => (
          <button key={i} type="button" onClick={() => setPrompt(i)} className="rounded-full bg-secondary px-2.5 py-1 text-[11px]">
            {i}
          </button>
        ))}
      </div>
      <Button className="w-full" onClick={() => void create()} disabled={busy || prompt.trim().length < 3}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
        {busy ? "Creating your challenge…" : "Create challenge"}
      </Button>
      {error ? <p className="rounded-xl bg-destructive/15 p-3 text-sm text-destructive">{error}</p> : null}
      {challenge ? (
        <div className="max-h-[45vh] space-y-2 overflow-y-auto rounded-2xl bg-secondary p-3 text-sm">
          <h3 className="text-base font-extrabold">{challenge.title}</h3>
          <p className="text-muted-foreground">{challenge.intro}</p>
          <ol className="list-decimal space-y-0.5 pl-5">
            {challenge.rules.map((r) => <li key={r}>{r}</li>)}
          </ol>
          {challenge.rounds.map((r, i) => (
            <div key={i} className="rounded-xl bg-background/60 p-2">
              <p className="text-xs font-bold text-primary">Round {i + 1} · {r.name}</p>
              <p>{r.task}</p>
            </div>
          ))}
          <p><b>Scoring:</b> {challenge.scoring}</p>
          <p><b>Winner:</b> {challenge.winner}</p>
          <Button size="sm" className="w-full" onClick={() => void post()}>
            <Send className="mr-2 h-4 w-4" /> Post to room
          </Button>
        </div>
      ) : null}
    </div>
  );
}
