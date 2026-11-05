import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BarChart3, Plus, Radio, Search, Settings, Users, Coins, LogOut, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NotificationsBell } from "@/components/NotificationsBell";
import { BottomNav } from "@/components/BottomNav";
import { SplashScreen } from "@/components/SplashScreen";
import { EMOJIS, THEMES, themeGradient, initials, type RoomRow, type SeatRow } from "@/lib/rooms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "popular", label: "Popular" },
  { key: "game", label: "Game" },
  { key: "chats", label: "Chats" },
  { key: "auction", label: "Auction" },
  { key: "acquaint", label: "Acquaint" },
  { key: "family", label: "Family" },
] as const;

const CREATE_CATEGORIES = ["game", "chats", "auction", "acquaint", "family"] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WeVoice — Live Voice Chat Rooms & Gifts" },
      {
        name: "description",
        content:
          "Join live voice chat rooms, grab a mic seat, chat with the crowd and send gifts. Real-time audio party rooms.",
      },
      { property: "og:title", content: "WeVoice — Live Voice Chat Rooms & Gifts" },
      {
        property: "og:description",
        content: "Join live voice rooms, take a mic seat, chat and send gifts in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [emoji, setEmoji] = useState("🎧");
  const [theme, setTheme] = useState("violet");
  const [category, setCategory] = useState<string>("chats");
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*, room_seats(user_id), profiles:host_id(display_name, avatar_url)")
        .eq("is_live", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as (RoomRow & {
        category?: string | null;
        room_seats: Pick<SeatRow, "user_id">[];
        profiles: { display_name: string; avatar_url: string | null } | null;
      })[];
    },
    refetchInterval: 8000,
  });

  const occupiedCount = (room: { room_seats?: Pick<SeatRow, "user_id">[] }) =>
    room.room_seats?.filter((s) => s.user_id).length ?? 0;

  const visibleRooms = rooms
    .filter((room) => {
      if (search && !`${room.name} ${room.topic ?? ""}`.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (tab === "all" || tab === "popular") return true;
      return (room.category ?? "chats") === tab;
    })
    .sort((a, b) => (tab === "popular" ? occupiedCount(b) - occupiedCount(a) : 0));

  const createRoom = async () => {
    setCreating(true);
    const { data, error } = await supabase.rpc("create_room", {
      _name: name || "New Room",
      _topic: topic,
      _cover_emoji: emoji,
      _theme: theme,
      _seat_count: 9,
      _category: category,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["rooms"] });
    const room = data as unknown as RoomRow;
    void navigate({ to: "/room/$roomId", params: { roomId: room.id } });
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <SplashScreen />;

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+3.5rem)]">
      <header className="app-header sticky top-0 z-20">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src={logo}
              alt="WeVoice logo"
              width={36}
              height={36}
              className="h-8 w-8 shrink-0 rounded-2xl sm:h-9 sm:w-9"
            />
            <span className="truncate font-display text-base font-extrabold tracking-tight sm:text-lg">
              WeVoice
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 pl-2 sm:gap-2 sm:pl-6">
            <Badge className="gold-gradient mr-0.5 gap-1 whitespace-nowrap rounded-full border-0 px-2.5 py-1 text-xs font-semibold text-accent-foreground sm:mr-1 sm:px-3 sm:text-sm">
              <Coins className="h-3.5 w-3.5" /> {profile?.coins ?? 0}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              asChild
              aria-label="Analytics"
              className="hidden text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground sm:inline-flex"

            >
              <Link to="/analytics">
                <BarChart3 className="h-4 w-4" />
              </Link>
            </Button>
            <NotificationsBell />
            <Button
              size="icon"
              variant="ghost"
              asChild
              aria-label="Account settings"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground sm:h-9 sm:w-9"
            >
              <Link to="/account">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Link to="/profile/$userId" params={{ userId: user.id }}>
              <Avatar className="h-8 w-8 border-2 border-primary-foreground/50 sm:h-9 sm:w-9">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback>{initials(profile?.display_name ?? "P")}</AvatarFallback>
              </Avatar>
            </Link>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="hidden text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground sm:inline-flex"

            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-3 w-full max-w-5xl sm:mt-4">
          <h1 className="font-display text-xl font-extrabold sm:text-3xl">Live rooms</h1>
          <p className="mt-1 text-xs text-primary-foreground/75 sm:text-sm">
            Pick a room, take a mic seat and start talking.
          </p>
          <div className="relative mt-3 sm:mt-4">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms or topics"
              className="h-11 rounded-2xl border-0 bg-card pl-11 text-foreground shadow-[var(--shadow-card)] sm:h-12"
              aria-label="Search rooms"
            />
          </div>
        </div>
      </header>


      <main className="mx-auto w-full max-w-5xl px-page pt-4 sm:pt-5">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setTab(c.key)}
              className={`chip ${tab === c.key ? "chip-active" : "hover:text-foreground"}`}
            >
              {c.label}
            </button>
          ))}
        </div>


        {isLoading ? (
          <div className="mt-10 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : visibleRooms.length === 0 ? (
          <div className="glass mt-8 rounded-3xl p-10 text-center">
            <p className="text-4xl">🎙️</p>
            <p className="mt-3 font-semibold">No rooms are live right now</p>
            <p className="text-sm text-muted-foreground">Create the first room and invite your friends.</p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {visibleRooms.map((room) => {
              const occupied = occupiedCount(room);
              const full = occupied >= room.seat_count;
              return (
                <Link
                  key={room.id}
                  to="/room/$roomId"
                  params={{ roomId: room.id }}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[var(--shadow-elevated)]"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1 brand-gradient opacity-80"
                  />
                  <div
                    className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-3xl ${themeGradient(room.theme)}`}
                  >
                    {room.cover_emoji}
                    <span className="absolute -bottom-1 -right-1 flex h-5 items-center gap-1 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                      <Radio className="h-2.5 w-2.5" /> LIVE
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-base font-bold sm:text-lg">{room.name}</h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {room.topic || "Come hang out and chat"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        <Users className="h-3.5 w-3.5" />
                        {occupied}/{room.seat_count} on mic
                      </span>
                      <span className="truncate">Host: {room.profiles?.display_name ?? "—"}</span>
                      <span className="chip capitalize">{room.category ?? "chats"}</span>
                    </div>
                  </div>

                  <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={room.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback>{initials(room.profiles?.display_name ?? "H")}</AvatarFallback>
                    </Avatar>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                      {full ? "Listen in" : "Join"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>


      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="brand-gradient fixed bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-30 h-12 -translate-x-1/2 gap-2 rounded-full px-6 font-semibold text-primary-foreground shadow-[var(--shadow-elevated)]">
            <Plus className="h-4 w-4" /> Create room
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New voice room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="room-name">Room name</Label>
              <Input
                id="room-name"
                value={name}
                placeholder="Late night gupshup"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room-topic">Topic</Label>
              <Input
                id="room-topic"
                value={topic}
                placeholder="Music, games, chill..."
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cover</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`h-10 w-10 rounded-xl text-xl transition ${
                      emoji === e ? "bg-primary/25 ring-2 ring-primary" : "bg-secondary"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {CREATE_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      category === c ? "bg-primary text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                {Object.keys(THEMES).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`h-10 flex-1 rounded-xl bg-gradient-to-br text-xs font-semibold capitalize ${THEMES[t]} ${
                      theme === t ? "ring-2 ring-primary" : "opacity-70"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => void createRoom()} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go live"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <BottomNav />
    </div>

  );
}
