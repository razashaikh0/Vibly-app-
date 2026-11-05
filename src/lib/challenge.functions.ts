import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({ roomId: z.string().uuid(), prompt: z.string().trim().min(3).max(400) });

const ChallengeSchema = z.object({
  title: z.string(),
  intro: z.string(),
  rules: z.array(z.string()),
  rounds: z.array(z.object({ name: z.string(), task: z.string() })),
  scoring: z.string(),
  winner: z.string(),
});

export type Challenge = z.infer<typeof ChallengeSchema>;

export const generateChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<{ challenge?: Challenge; error?: string }> => {
    const { data: room } = await context.supabase
      .from("rooms")
      .select("host_id")
      .eq("id", data.roomId)
      .maybeSingle();
    if (!room || room.host_id !== context.userId) return { error: "Only the room host can create challenges." };

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "AI is not configured." };

    const { streamText, Output, NoObjectGeneratedError } = await import("ai");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { createLovableAiGatewayRunIdFetch } = await import("./run-id.server");
    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        output: Output.object({ schema: ChallengeSchema }),
        system:
          "You design fun, safe party challenges for a live voice-chat room (2-8 players on mics, chatting and sending gifts). " +
          "Everything must be playable by voice and chat only, no physical risk, family friendly, in simple English. " +
          "Give 3-5 short rules, exactly 3 rounds, a clear scoring line and how the winner is decided. Keep each line under 160 characters.",
        prompt: `Host's theme or challenge idea: ${data.prompt}`,
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const out = await result.output;
      return {
        challenge: { ...out, rules: out.rules.slice(0, 5), rounds: out.rounds.slice(0, 3) },
      };
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) return { error: "The AI reply was incomplete. Try again." };
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 402) return { error: "AI credits are used up. Add credits to keep generating." };
      if (status === 429) return { error: "Too many requests right now. Wait a moment and try again." };
      console.error("challenge error", e);
      return { error: "Could not create the challenge. Please try again." };
    }
  });
