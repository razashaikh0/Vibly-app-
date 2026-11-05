import { supabase } from "@/integrations/supabase/client";

export type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  room_id: string | null;
  kind: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

/** Fire-and-forget in-app notification to another user. */
export async function notifyUser(input: {
  userId: string;
  actorId: string;
  roomId?: string | null;
  kind: "mention" | "gift" | "seat" | "invite" | "system";
  body: string;
}) {
  if (input.userId === input.actorId) return;
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    actor_id: input.actorId,
    room_id: input.roomId ?? null,
    kind: input.kind,
    body: input.body,
  });
  if (error) console.warn("notify failed", error.message);
}
