import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Clock3, Loader2, MessageCircle, Radio, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NotificationsBell } from "@/components/NotificationsBell";
import { PageShell } from "@/components/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatsPage,
});

type ChatMessage = {
  id: string;
  content: string;
  created_at: string;
  rooms: { id: string; name: string; cover_emoji: string } | null;
  profiles: { display_name: string; avatar_url: string | null } | null;
};

function timeLabel(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}

function ChatsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active">("all");
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["recent-chats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_messages")
        .select(
          "id, content, created_at, rooms:room_id(id, name, cover_emoji), profiles:user_id(display_name, avatar_url)",
        )
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as ChatMessage[];
    },
    refetchInterval: 15000,
  });

  const threads = useMemo(() => {
    const byRoom = new Map<string, ChatMessage>();
    for (const message of messages) {
      if (message.rooms && !byRoom.has(message.rooms.id)) byRoom.set(message.rooms.id, message);
    }
    const query = search.trim().toLowerCase();
    return [...byRoom.values()].filter((thread) => {
      if (!query) return true;
      return `${thread.rooms?.name ?? ""} ${thread.content} ${thread.profiles?.display_name ?? ""}`
        .toLowerCase()
        .includes(query);
    });
  }, [messages, search]);

  return (
    <PageShell className="pb-8">
      <header className="app-page-header glass border-x-0 border-t-0 px-4 py-5">
        <div className="mx-auto flex max-w-2xl items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-eyebrow text-primary">SOCIAL INBOX</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Chats</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Room conversations, invitations and live updates in one place.
            </p>
          </div>
          <NotificationsBell />
        </div>
        <div className="mx-auto mt-4 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rooms or messages"
              className="h-11 rounded-2xl pl-10"
              aria-label="Search chats"
            />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 pb-8 pt-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`chip ${filter === "all" ? "chip-active" : ""}`}
          >
            <MessageCircle className="h-3.5 w-3.5" /> All chats
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`chip ${filter === "active" ? "chip-active" : ""}`}
          >
            <Radio className="h-3.5 w-3.5" /> Live rooms
          </button>
          <Badge variant="secondary" className="ml-auto gap-1 rounded-full text-[10px]">
            <Users className="h-3 w-3" /> {threads.length} rooms
          </Badge>
        </div>
        <section className="mt-5 space-y-2">
          {isLoading ? (
            <div className="grid place-items-center py-14">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : threads.length === 0 ? (
            <div className="glass rounded-3xl px-6 py-14 text-center">
              <MessageCircle className="mx-auto h-9 w-9 text-primary opacity-60" />
              <p className="mt-3 font-semibold">{search ? "No matching chats" : "No chats yet"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? "Try another room name or message."
                  : "Join a voice room and say hi to start a conversation."}
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Explore rooms <Radio className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            threads.map((thread) => (
              <Link
                key={thread.id}
                to="/room/$roomId"
                params={{ roomId: thread.rooms!.id }}
                className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card"
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 rounded-2xl">
                    <AvatarImage
                      src={thread.profiles?.avatar_url ?? undefined}
                      alt={thread.rooms!.name}
                    />
                    <AvatarFallback className="rounded-2xl bg-primary/10">
                      <Radio className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-background">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold">{thread.rooms!.name}</p>
                    <span className="shrink-0 rounded-full bg-destructive/12 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-destructive">
                      Live
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    <b className="font-semibold text-foreground/80">
                      {thread.profiles?.display_name ?? "Someone"}:
                    </b>{" "}
                    {thread.content}
                  </p>
                  <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock3 className="h-3 w-3" /> {timeLabel(thread.created_at)} · Tap to join room
                  </span>
                </div>
                <Radio className="h-4 w-4 shrink-0 text-primary opacity-0 transition group-hover:opacity-100" />
              </Link>
            ))
          )}
        </section>
        <section className="glass mt-6 flex items-center gap-3 rounded-2xl p-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-semibold">Room invitations and gifts</p>
            <p className="text-[11px] text-muted-foreground">
              Notifications are available from the bell above.
            </p>
          </div>
          <NotificationsBell />
        </section>
      </main>
    </PageShell>
  );
}
