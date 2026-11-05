import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Ban,
  Coins,
  Crown,
  Flag,
  Gift,
  LayoutGrid,
  Loader2,
  Lock,
  LogOut,
  Mic,
  MicOff,
  Radio,
  Send,
  Trophy,
  Undo2,
  Unlock,
  User,
  UserPlus,
  UserRound,
  UserMinus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceRoom } from "@/hooks/useVoiceRoom";
import { NotificationsBell } from "@/components/NotificationsBell";
import { FxOverlay } from "@/components/FxOverlay";
import { notifyUser } from "@/lib/notify";
import { recordVipEntry, GLOBAL_GIFT_THRESHOLD } from "@/lib/fx";
import { RoomHubPanel } from "@/components/RoomHubPanel";
import { SpyGame } from "@/components/SpyGame";
import { AiChallengeMaker } from "@/components/AiChallengeMaker";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

import {
  themeGradient,
  initials,
  type GiftRow,
  type MessageRow,
  type RoomRow,
  type SeatRow,
} from "@/lib/rooms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SeatFrame, CharmBadge, WaveIndicator } from "@/components/SeatFrame";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/room/$roomId")({
  head: () => ({
    meta: [
      { title: "Voice room — WeVoice" },
      {
        name: "description",
        content: "Live voice room with mic seats, real-time chat and gifting on WeVoice.",
      },
      { property: "og:title", content: "Voice room — WeVoice" },
      {
        property: "og:description",
        content: "Live voice room with mic seats, real-time chat and gifting on WeVoice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoomPage,
});

type FlyingGift = { id: string; emoji: string; label: string };

function RoomPage() {
  const { roomId } = useParams({ from: "/room/$roomId" });
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [micOn, setMicOn] = useState(true);
  const [draft, setDraft] = useState("");
  const [giftTarget, setGiftTarget] = useState<{ id: string; name: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<SeatRow | null>(null);
  const [reportReason, setReportReason] = useState("Abusive behaviour");
  const [flying, setFlying] = useState<FlyingGift[]>([]);
  const [gamePanel, setGamePanel] = useState(false);
  const [spyOpen, setSpyOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [giftTab, setGiftTab] = useState<string>("all");
  const [packetOpen, setPacketOpen] = useState(false);
  const [packetAmount, setPacketAmount] = useState(1000);
  const [packetCount, setPacketCount] = useState(5);
  const [sendingPacket, setSendingPacket] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  const [hubTab, setHubTab] = useState<"wall" | "members">("wall");
  const [following, setFollowing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const voiceSessionIdRef = useRef<string | null>(null);
  const vipEntryDoneRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*, host:host_id(id, display_name, avatar_url, username)")
        .eq("id", roomId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as RoomRow & {
        host: { id: string; display_name: string; avatar_url: string | null } | null;
      };
    },
  });

  const seatsQuery = useQuery({
    queryKey: ["seats", roomId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_seats")
        .select("*, profiles:user_id(id, display_name, username, avatar_url, coins)")
        .eq("room_id", roomId)
        .order("seat_index");
      if (error) throw error;
      return data as unknown as SeatRow[];
    },
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", roomId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_messages")
        .select("*, profiles:user_id(id, display_name, username, avatar_url, coins)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return data as unknown as MessageRow[];
    },
  });

  const giftsQuery = useQuery({
    queryKey: ["gifts"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("gifts").select("*").order("price");
      if (error) throw error;
      return data as unknown as GiftRow[];
    },
  });

  const blockedQuery = useQuery({
    queryKey: ["blocked", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocker_id", user!.id);
      if (error) throw error;
      return data as { blocked_id: string }[];
    },
  });
  const blockedIds = useMemo(
    () => new Set((blockedQuery.data ?? []).map((b) => b.blocked_id)),
    [blockedQuery.data],
  );

  const room = roomQuery.data;
  const seats = useMemo(() => seatsQuery.data ?? [], [seatsQuery.data]);
  const mySeat = seats.find((s) => s.user_id === user?.id) ?? null;
  const isHost = !!room && room.host_id === user?.id;
  const canSpeak = !!mySeat && !mySeat.is_muted && micOn;
  const mySeatMuted = mySeat?.is_muted;
  const mySeatId = mySeat?.id;

  // keep local mic state in sync with the seat row (host mute / other devices)
  useEffect(() => {
    if (mySeatId) setMicOn(!mySeatMuted);
  }, [mySeatId, mySeatMuted]);

  // VIP entry animation — level is computed server-side from the live coin
  // balance, and the insert is idempotent, so reconnects never double-fire and
  // a level-up during the session upgrades the animation.
  useEffect(() => {
    if (vipEntryDoneRef.current) return;
    if (!room || !user) return;
    vipEntryDoneRef.current = true;
    void recordVipEntry(roomId);
  }, [room, user, roomId]);

  // real entry/exit events: presence is written server-side so every other
  // client sees the join instantly and the member ranking gets activity points
  useEffect(() => {
    if (!user) return;
    void supabase.rpc("join_room", { _room_id: roomId });
    const leave = () => {
      void supabase.rpc("leave_room", { _room_id: roomId });
    };
    window.addEventListener("beforeunload", leave);
    return () => {
      window.removeEventListener("beforeunload", leave);
      leave();
    };
  }, [roomId, user]);

  // a promotion mid-session should be allowed to fire a new (higher) tier entry
  const myCoins = profile?.coins ?? 0;
  useEffect(() => {
    if (!vipEntryDoneRef.current || !room) return;
    void recordVipEntry(roomId);
  }, [myCoins, room, roomId]);

  const { micError, speaking, reconnecting } = useVoiceRoom({
    roomId,
    userId: user?.id ?? null,
    publish: canSpeak,
  });
  const reconnectCount = Object.keys(reconnecting).length;

  useEffect(() => {
    if (micError) toast.error(micError);
  }, [micError]);

  // realtime — keep mutable data in refs so the channel subscribes once per room
  const seatsRef = useRef(seats);
  seatsRef.current = seats;
  const giftsRef = useRef(giftsQuery.data);
  giftsRef.current = giftsQuery.data;

  const refreshSeatsAndChat = useDebouncedCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["seats", roomId] });
    void queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
  }, 600);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`room-db-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_seats", filter: `room_id=eq.${roomId}` },
        () => void queryClient.invalidateQueries({ queryKey: ["seats", roomId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        () => void queryClient.invalidateQueries({ queryKey: ["messages", roomId] }),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gift_events", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const evt = payload.new as { gift_id: string; receiver_id: string; quantity: number };
          const gift = giftsRef.current?.find((g) => g.id === evt.gift_id);
          const receiver = seatsRef.current.find((s) => s.user_id === evt.receiver_id)?.profiles
            ?.display_name;
          setFlying((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              emoji: gift?.emoji ?? "🎁",
              label: `${gift?.name ?? "Gift"} ×${evt.quantity} → ${receiver ?? "someone"}`,
            },
          ]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        () => void queryClient.invalidateQueries({ queryKey: ["room", roomId] }),
      )
      // coin balances drive charm frames / level badges — coalesced so a burst of
      // profile updates refreshes seats + chat once
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () =>
        refreshSeatsAndChat(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId, user, queryClient, refreshSeatsAndChat]);

  useEffect(() => {
    if (flying.length === 0) return;
    const t = setTimeout(() => setFlying((prev) => prev.slice(1)), 2200);
    return () => clearTimeout(t);
  }, [flying]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  const endVoiceSession = async () => {
    const id = voiceSessionIdRef.current;
    if (!id) return;
    voiceSessionIdRef.current = null;
    await supabase
      .from("voice_sessions")
      .update({ left_at: new Date().toISOString() })
      .eq("id", id);
  };

  const takeSeat = async (seat: SeatRow) => {
    if (!user) return;
    if (seat.user_id) return;
    if (seat.is_locked && !isHost) {
      toast.error("This seat is locked");
      return;
    }
    if (mySeat) {
      await supabase
        .from("room_seats")
        .update({ user_id: null, is_muted: false })
        .eq("id", mySeat.id);
      await endVoiceSession();
    }
    const { error } = await supabase
      .from("room_seats")
      .update({ user_id: user.id, is_muted: false })
      .eq("id", seat.id)
      .is("user_id", null);
    if (error) {
      toast.error("Could not take the seat, please try again");
    } else {
      setMicOn(true);
      const { data: vs } = await supabase
        .from("voice_sessions")
        .insert({ user_id: user.id, room_id: roomId })
        .select("id")
        .single();
      if (vs) voiceSessionIdRef.current = (vs as { id: string }).id;
      if (room && room.host_id !== user.id) {
        void notifyUser({
          userId: room.host_id,
          actorId: user.id,
          roomId,
          kind: "seat",
          body: `${profile?.display_name ?? "Koi"} ne aapke room me mic seat li 🎙️`,
        });
      }
    }
    await queryClient.invalidateQueries({ queryKey: ["seats", roomId] });
  };

  const leaveSeat = async () => {
    if (!mySeat) return;
    await supabase
      .from("room_seats")
      .update({ user_id: null, is_muted: false })
      .eq("id", mySeat.id);
    await endVoiceSession();
    await queryClient.invalidateQueries({ queryKey: ["seats", roomId] });
  };

  // close voice session if user leaves the page while seated
  useEffect(() => {
    return () => {
      void endVoiceSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mute state sync: keep the seat row in step with the local mic so every
  // device shows the same mic icon instantly
  const toggleMic = async () => {
    if (!mySeat) return;
    const next = !micOn;
    setMicOn(next);
    await supabase.from("room_seats").update({ is_muted: !next }).eq("id", mySeat.id);
    await queryClient.invalidateQueries({ queryKey: ["seats", roomId] });
  };

  const blockUser = async (seat: SeatRow) => {
    if (!user || !seat.user_id) return;
    if (blockedIds.has(seat.user_id)) {
      await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", seat.user_id);
      toast.success(`${seat.profiles?.display_name} unblocked`);
    } else {
      const { error } = await supabase
        .from("blocked_users")
        .insert({ blocker_id: user.id, blocked_id: seat.user_id });
      if (error) {
        toast.error("Could not block");
        return;
      }
      toast.success(`${seat.profiles?.display_name} blocked`);
    }
    await queryClient.invalidateQueries({ queryKey: ["blocked", user.id] });
  };

  const submitReport = async () => {
    if (!user || !reportTarget?.user_id) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: reportTarget.user_id,
      room_id: roomId,
      reason: reportReason,
    });
    if (error) {
      toast.error("Could not send report");
      return;
    }
    toast.success("Report bhej di gayi. Team review karegi.");
    setReportTarget(null);
  };

  const hostToggleMute = async (seat: SeatRow) => {
    await supabase.from("room_seats").update({ is_muted: !seat.is_muted }).eq("id", seat.id);
    await queryClient.invalidateQueries({ queryKey: ["seats", roomId] });
  };

  const hostKick = async (seat: SeatRow) => {
    await supabase.from("room_seats").update({ user_id: null, is_muted: false }).eq("id", seat.id);
    await queryClient.invalidateQueries({ queryKey: ["seats", roomId] });
  };

  const hostToggleLock = async (seat: SeatRow) => {
    await supabase
      .from("room_seats")
      .update({ is_locked: !seat.is_locked, user_id: null })
      .eq("id", seat.id);
    await queryClient.invalidateQueries({ queryKey: ["seats", roomId] });
  };

  const closeRoom = async () => {
    await supabase.from("rooms").update({ is_live: false }).eq("id", roomId);
    void navigate({ to: "/" });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !user) return;
    setDraft("");
    const { error } = await supabase
      .from("room_messages")
      .insert({ room_id: roomId, user_id: user.id, content });
    if (error) {
      toast.error("Could not send message");
      return;
    }
    // don't wait for the realtime echo — show my own message instantly
    void queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
    // @mention notifications for people seated in this room
    for (const seat of seats) {
      const name = seat.profiles?.display_name;
      if (!seat.user_id || seat.user_id === user.id || !name) continue;
      if (
        content.toLowerCase().includes(`@${name.toLowerCase()}`) ||
        (seat.profiles?.username &&
          content.toLowerCase().includes(`@${seat.profiles.username.toLowerCase()}`))
      ) {
        void notifyUser({
          userId: seat.user_id,
          actorId: user.id,
          roomId,
          kind: "mention",
          body: `${profile?.display_name ?? "Koi"} ne aapko mention kiya: “${content.slice(0, 80)}”`,
        });
      }
    }
  };

  const giftTiers = [...new Set((giftsQuery.data ?? []).map((g) => g.tier))];

  const [giftQty, setGiftQty] = useState(1);

  const sendGift = async (gift: GiftRow) => {
    if (!giftTarget?.id || !user) return;
    const receiverId = giftTarget.id;
    const quantity = Math.max(1, Math.min(99, giftQty));
    const receiverName = giftTarget.name;
    const { error } = await supabase.rpc("send_gift", {
      _room_id: roomId,
      _receiver_id: receiverId,
      _gift_id: gift.id,
      _quantity: quantity,
    });
    if (error) {
      toast.error(error.message.includes("coins") ? "Not enough coins" : error.message);
      return;
    }
    setGiftTarget(null);
    toast.success(`${gift.emoji} ${gift.name} ×${quantity} sent!`);

    // The 40k+ server-wide animation is recorded inside send_gift (idempotent).

    if (receiverId !== user.id) {
      void notifyUser({
        userId: receiverId,
        actorId: user.id,
        roomId,
        kind: "gift",
        body: `${profile?.display_name ?? "Someone"} sent you ${gift.emoji} ${gift.name} ×${quantity}!`,
      });
    }
  };

  const sendRedPacket = async () => {
    if (!user) return;
    setSendingPacket(true);
    const { error } = await supabase.rpc("send_red_packet", {
      _room_id: roomId,
      _amount: packetAmount,
      _packet_count: packetCount,
      _message: "Lucky Red Packet",
    });
    setSendingPacket(false);
    if (error) {
      toast.error(error.message.includes("coins") ? "Not enough coins" : error.message);
      return;
    }
    setPacketOpen(false);
    setGamePanel(false);
    toast.success("Lucky Red Packet dropped!");
    // send_red_packet records the animation server-side, once per packet.
  };

  if (loading || roomQuery.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="text-4xl">🚪</p>
          <p className="mt-3 font-semibold">Room not found</p>
          <Button className="mt-4" onClick={() => void navigate({ to: "/" })}>
            Back to rooms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background/35">
      <div
        className={`pointer-events-none fixed inset-0 bg-gradient-to-b ${themeGradient(room.theme)}`}
      />

      <header className="glass sticky top-0 z-20 flex items-center gap-3 border-x-0 border-t-0 px-4 py-3.5 lg:px-6">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => void navigate({ to: "/" })}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Radio className="h-4 w-4" />
            </span>
            <p className="truncate font-display font-bold leading-tight">{room.name}</p>
            <span className="hidden rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-destructive sm:inline-flex">
              Live
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{room.topic || "Live voice room"}</span>
            <span aria-hidden>·</span>
            <span className="hidden sm:inline">ID {room.id.slice(0, 8).toUpperCase()}</span>
            <span aria-hidden>·</span>
            <span>{seats.filter((seat) => seat.user_id).length} on mic</span>
          </div>
        </div>
        {reconnectCount > 0 && (
          <Badge
            variant="outline"
            className="gap-1 rounded-full border-amber-500/50 text-amber-600"
          >
            <Loader2 className="h-3 w-3 animate-spin" /> Reconnecting…
          </Badge>
        )}
        <Badge variant="secondary" className="gap-1 rounded-full text-gold">
          <Coins className="h-3.5 w-3.5" /> {profile?.coins ?? 0}
        </Badge>
        <Button
          size="sm"
          variant={following ? "secondary" : "default"}
          className="hidden gap-1.5 rounded-full sm:inline-flex"
          onClick={() => {
            setFollowing((value) => !value);
            toast.success(following ? "Room unfollowed" : "Room followed");
          }}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {following ? "Following" : "Follow"}
        </Button>
        <NotificationsBell />
        {isHost && (
          <Button
            size="sm"
            variant="destructive"
            className="rounded-full"
            onClick={() => void closeRoom()}
          >
            Close
          </Button>
        )}
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-3 py-4 sm:px-4 sm:py-6 lg:flex-row lg:gap-6">
        <section className="lg:flex-1">
          <div className="room-stage rounded-[2rem] p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-eyebrow text-primary">VOICE STAGE</p>
                <h1 className="mt-1 font-display text-xl font-extrabold tracking-tight sm:text-2xl">
                  Join the conversation
                </h1>
              </div>
              <span className="hidden items-center gap-2 rounded-full bg-background/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground sm:inline-flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Audio live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-4 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4">
              {seats.map((seat) => {
                const occupant = seat.profiles;
                const isSpeaking = seat.user_id ? speaking[seat.user_id] && !seat.is_muted : false;
                const seatIsHost = seat.user_id === room.host_id;
                return (
                  <div key={seat.id} className="flex flex-col items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        disabled={!seat.user_id || seat.user_id === user?.id}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (!seat.user_id) void takeSeat(seat);
                          }}
                          className={`relative grid h-16 w-16 place-items-center rounded-full transition sm:h-20 sm:w-20 ${
                            seat.user_id
                              ? ""
                              : seat.is_locked
                                ? "border border-dashed border-border bg-muted/40"
                                : "border border-dashed border-primary/40 bg-muted/30 hover:bg-primary/15"
                          }`}
                          style={
                            isSpeaking
                              ? { animation: "speak-ring 1.2s ease-out infinite" }
                              : undefined
                          }
                          aria-label={
                            occupant ? occupant.display_name : `Seat ${seat.seat_index + 1}`
                          }
                        >
                          {occupant ? (
                            <SeatFrame charm={occupant.coins ?? 0} size={72} speaking={isSpeaking}>
                              <Avatar className="h-[3.6rem] w-[3.6rem]">
                                <AvatarImage src={occupant.avatar_url ?? undefined} />
                                <AvatarFallback aria-label={`${occupant.display_name} avatar`}>
                                  <UserRound className="h-6 w-6 text-muted-foreground" />
                                </AvatarFallback>
                              </Avatar>
                            </SeatFrame>
                          ) : seat.is_locked ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Mic className="h-5 w-5 text-primary" />
                          )}
                          {seatIsHost && (
                            <span className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-gold text-[10px] text-background">
                              <Crown className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {seat.user_id && seat.is_muted && (
                            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-destructive text-destructive-foreground">
                              <MicOff className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        {seat.user_id && (
                          <DropdownMenuItem asChild>
                            <Link to="/profile/$userId" params={{ userId: seat.user_id }}>
                              <User className="mr-2 h-4 w-4" /> View profile
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            seat.user_id &&
                            setGiftTarget({
                              id: seat.user_id,
                              name: seat.profiles?.display_name ?? "player",
                            })
                          }
                        >
                          <Gift className="mr-2 h-4 w-4" /> Send gift
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void blockUser(seat)}>
                          {blockedIds.has(seat.user_id ?? "") ? (
                            <>
                              <Undo2 className="mr-2 h-4 w-4" /> Unblock user
                            </>
                          ) : (
                            <>
                              <Ban className="mr-2 h-4 w-4" /> Block user
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setReportTarget(seat)}>
                          <Flag className="mr-2 h-4 w-4" /> Report
                        </DropdownMenuItem>
                        {isHost && (
                          <>
                            <DropdownMenuItem onClick={() => void hostToggleMute(seat)}>
                              {seat.is_muted ? (
                                <Mic className="mr-2 h-4 w-4" />
                              ) : (
                                <MicOff className="mr-2 h-4 w-4" />
                              )}
                              {seat.is_muted ? "Unmute" : "Mute"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void hostKick(seat)}>
                              <UserMinus className="mr-2 h-4 w-4" /> Remove from seat
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void hostToggleLock(seat)}>
                              {seat.is_locked ? (
                                <Unlock className="mr-2 h-4 w-4" />
                              ) : (
                                <Lock className="mr-2 h-4 w-4" />
                              )}
                              {seat.is_locked ? "Unlock seat" : "Lock seat"}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <p className="flex w-full items-center justify-center gap-1 truncate text-center text-[11px] text-muted-foreground">
                      {occupant ? <WaveIndicator active={isSpeaking} /> : null}
                      <span className="truncate">
                        {occupant?.display_name ??
                          (seat.is_locked ? "Locked" : `Seat ${seat.seat_index + 1}`)}
                      </span>
                    </p>
                    {occupant ? <CharmBadge charm={occupant.coins ?? 0} /> : null}

                    {isHost && !seat.user_id && (
                      <button
                        type="button"
                        className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                        onClick={() => void hostToggleLock(seat)}
                      >
                        {seat.is_locked ? "unlock" : "lock"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="room-controls mt-4 flex items-center gap-3 rounded-2xl p-3 sm:p-4">
            {mySeat ? (
              <>
                <Button
                  className="flex-1 gap-2 rounded-full"
                  variant={micOn && !mySeat.is_muted ? "default" : "secondary"}
                  onClick={() => void toggleMic()}
                >
                  {micOn && !mySeat.is_muted ? (
                    <Mic className="h-4 w-4" />
                  ) : (
                    <MicOff className="h-4 w-4" />
                  )}
                  {micOn && !mySeat.is_muted ? "Mic on" : "Mic off"}
                </Button>
                <Button
                  variant="ghost"
                  className="gap-2 rounded-full"
                  onClick={() => void leaveSeat()}
                >
                  <LogOut className="h-4 w-4" /> Leave seat
                </Button>
              </>
            ) : (
              <p className="px-2 text-sm text-muted-foreground">
                Listener mode — tap any empty seat to take the mic.
              </p>
            )}
          </div>
        </section>

        <section className="room-chat glass flex h-[22rem] w-full flex-col rounded-[2rem] p-3.5 lg:h-auto lg:min-h-[34rem] lg:w-80">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <p className="text-eyebrow text-primary">COMMUNITY</p>
              <p className="mt-1 text-sm font-bold">Room chat</p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              {messagesQuery.data?.length ?? 0} messages
            </span>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            <p className="rounded-lg bg-primary/10 px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
              🔔 System: this room uses high quality audio mode. Be respectful — abuse, spam and
              personal data sharing are not allowed.
            </p>
            {(messagesQuery.data ?? [])
              .filter((m) => !blockedIds.has(m.user_id))
              .map((m) => (
                <div key={m.id} className="flex gap-1.5">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={m.profiles?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[9px]">
                      <UserRound className="h-3 w-3 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <span className="flex items-center gap-1">
                      <span className="rounded bg-primary/15 px-1 text-[9px] font-bold text-primary">
                        Lv.{Math.max(1, Math.floor((m.profiles?.coins ?? 0) / 1000))}
                      </span>
                      <Link
                        to="/profile/$userId"
                        params={{ userId: m.user_id }}
                        className="truncate text-[11px] font-semibold text-primary hover:underline"
                      >
                        {m.profiles?.display_name ?? "Player"}
                      </Link>
                    </span>
                    <p className="text-xs leading-snug break-words">{m.content}</p>
                  </div>
                </div>
              ))}
            <div ref={chatEndRef} />
          </div>
          <form className="mt-3 flex gap-2" onSubmit={sendMessage}>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              maxLength={300}
            />
            <Button
              size="icon"
              type="button"
              variant="secondary"
              aria-label="Game entertainment"
              onClick={() => setGamePanel(true)}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              type="button"
              variant="secondary"
              aria-label="Gift wall and members"
              onClick={() => {
                setHubTab("wall");
                setHubOpen(true);
              }}
            >
              <Gift className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              type="button"
              variant="secondary"
              aria-label="Room member ranking"
              onClick={() => {
                setHubTab("members");
                setHubOpen(true);
              }}
            >
              <Trophy className="h-4 w-4" />
            </Button>
            <Button size="icon" type="submit" aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex flex-col items-center gap-2">
        {flying.map((f) => (
          <div
            key={f.id}
            className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm"
            style={{ animation: "gift-fly 2.2s ease-out forwards" }}
          >
            <span className="text-2xl">{f.emoji}</span> {f.label}
          </div>
        ))}
      </div>

      <FxOverlay roomId={roomId} />

      <Dialog open={!!giftTarget} onOpenChange={(o) => !o && setGiftTarget(null)}>
        <DialogContent className="top-auto bottom-0 translate-y-0 rounded-b-none rounded-t-[2rem] p-5 sm:top-[50%] sm:bottom-auto sm:translate-y-[-50%] sm:rounded-2xl sm:p-6">
          <DialogHeader>
            <DialogTitle>Gift for {giftTarget?.name ?? "player"}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4 overflow-x-auto pb-1 text-sm font-bold">
            {["all", ...giftTiers].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setGiftTab(t)}
                className={`whitespace-nowrap capitalize transition-opacity ${
                  giftTab === t ? "text-primary opacity-100" : "opacity-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(giftsQuery.data ?? [])
              .filter((g) => giftTab === "all" || g.tier === giftTab)
              .map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => void sendGift(g)}
                  className="rounded-2xl bg-secondary p-3 text-center transition hover:bg-primary/20"
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <p className="mt-1 truncate text-[11px]">{g.name}</p>
                  <p className="text-[11px] text-gold">{g.price}</p>
                </button>
              ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Quantity</span>
            {[1, 10, 66, 99].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setGiftQty(q)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  giftQty === q ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                ×{q}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Balance: {profile?.coins ?? 0} coins · gifts worth{" "}
            {GLOBAL_GIFT_THRESHOLD.toLocaleString()}+ coins trigger a server-wide animation
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={packetOpen} onOpenChange={setPacketOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🧧 Lucky Red Packet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold">Coins</p>
              <div className="flex flex-wrap gap-2">
                {[1000, 5000, 20000, 50000].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setPacketAmount(a)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      packetAmount === a ? "bg-primary text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold">Packets</p>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 20, 50].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPacketCount(c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      packetCount === c ? "bg-primary text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Balance: {profile?.coins ?? 0} coins. Every red packet flies across the whole server.
            </p>
            <Button
              className="w-full rounded-full"
              disabled={sendingPacket}
              onClick={() => void sendRedPacket()}
            >
              {sendingPacket ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Drop red packet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={hubOpen} onOpenChange={setHubOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Room hub</DialogTitle>
          </DialogHeader>
          <RoomHubPanel
            roomId={roomId}
            initialTab={hubTab}
            memberIds={seats.map((s) => s.user_id).filter((id): id is string => !!id)}
            onGift={(u) => {
              setHubOpen(false);
              setGiftTarget(u);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={gamePanel} onOpenChange={setGamePanel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game Entertainment</DialogTitle>
          </DialogHeader>
          {spyOpen ? (
            <div className="space-y-3">
              <Button variant="secondary" size="sm" onClick={() => setSpyOpen(false)}>
                Back to games
              </Button>
              {user ? <SpyGame roomId={roomId} userId={user.id} /> : null}
            </div>
          ) : aiOpen ? (
            <div className="space-y-3">
              <Button variant="secondary" size="sm" onClick={() => setAiOpen(false)}>
                Back to games
              </Button>
              {user ? <AiChallengeMaker roomId={roomId} userId={user.id} isHost={isHost} /> : null}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 text-center text-[11px] font-medium">
              {(
                [
                  { emoji: "🪄", label: "AI Challenge" },
                  { emoji: "🕵️", label: "Who's the Spy" },
                  { emoji: "🧧", label: "Red Packets" },
                  { emoji: "🎲", label: "Ludo" },
                  { emoji: "✏️", label: "Guess My Drawing" },
                  { emoji: "🎤", label: "Mic Grab" },
                  { emoji: "🃏", label: "UNO" },
                  { emoji: "🎵", label: "Music" },
                ] as { emoji: string; label: string; slug?: string }[]
              ).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() =>
                    item.slug
                      ? navigate({ to: "/play/$slug", params: { slug: item.slug } })
                      : item.label === "Red Packets"
                        ? setPacketOpen(true)
                        : item.label === "Who's the Spy"
                          ? setSpyOpen(true)
                          : item.label === "AI Challenge"
                            ? setAiOpen(true)
                            : toast.info(`${item.label} coming soon`)
                  }
                  className="rounded-2xl bg-secondary p-3 transition hover:bg-primary/20"
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <p className="mt-1 truncate">{item.label}</p>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!reportTarget} onOpenChange={(o) => !o && setReportTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {reportTarget?.profiles?.display_name ?? "user"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {["Abusive behaviour", "Spam", "Harassment", "Inappropriate content", "Other"].map(
              (r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReportReason(r)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                    reportReason === r
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {r}
                </button>
              ),
            )}
            <Button className="w-full rounded-full" onClick={() => void submitReport()}>
              <Flag className="mr-2 h-4 w-4" /> Submit report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
