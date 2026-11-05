import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageCircle, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/chats")({
  head: () => ({
    meta: [
      { title: "Chats — Recent Voice Room Conversations" },
      {
        name: "description",
        content: "Catch up on the latest messages from the voice rooms you hang out in.",
      },
      { property: "og:title", content: "Chats — Recent Voice Room Conversations" },
      { property: "og:description", content: "Your latest voice room chat activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatsPage,
});

function ChatsPage() {
  const { user } = useAuth();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["recent-chats"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_messages")
        .select(
          "id, content, created_at, rooms:room_id(id, name, cover_emoji), profiles:user_id(display_name, avatar_url)",
        )
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        content: string;
        created_at: string;
        rooms: { id: string; name: string; cover_emoji: string } | null;
        profiles: { display_name: string; avatar_url: string | null } | null;
      }[];
    },
    refetchInterval: 15000,
  });

  const byRoom = new Map<string, (typeof messages)[number]>();
  for (const msg of messages) {
    if (msg.rooms && !byRoom.has(msg.rooms.id)) byRoom.set(msg.rooms.id, msg);
  }
  const threads = [...byRoom.values()];

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <div className="mx-auto max-w-lg px-4 pt-5">
        <h1 className="text-3xl font-black tracking-tight">Chats</h1>

        {isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : threads.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <MessageCircle className="mx-auto mb-3 h-8 w-8 opacity-40" />
            No chats yet. Join a voice room and say hi.
          </div>
        ) : (
          <ul className="mt-4 space-y-1">
            {threads.map((thread) => (
              <li key={thread.id}>
                <Link
                  to="/room/$roomId"
                  params={{ roomId: thread.rooms!.id }}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={thread.profiles?.avatar_url ?? undefined}
                      alt={thread.rooms!.name}
                    />
                    <AvatarFallback>
                      <Radio className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{thread.rooms!.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {thread.profiles?.display_name ?? "Someone"}: {thread.content}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(thread.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
