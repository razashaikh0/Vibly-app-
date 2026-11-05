import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, AtSign, Gift, Mic, DoorOpen, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/rooms";
import type { NotificationRow } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const KIND_ICON: Record<string, typeof Bell> = {
  mention: AtSign,
  gift: Gift,
  seat: Mic,
  invite: DoorOpen,
  system: Info,
};

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function NotificationsBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, actor:actor_id(display_name, avatar_url)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as unknown as (NotificationRow & {
        actor: { display_name: string; avatar_url: string | null } | null;
      })[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => void queryClient.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const unread = notifications.filter((n) => !n.read_at);

  const markAllRead = async () => {
    if (!user || unread.length === 0) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    await queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  return (
    <Popover onOpenChange={(open) => { if (open) void markAllRead(); }}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b px-4 py-3 text-sm font-semibold">Notifications</p>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            notifications.map((n) => {
              const Icon = KIND_ICON[n.kind] ?? Info;
              const inner = (
                <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/60">
                  {n.actor ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={n.actor.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {initials(n.actor.display_name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary">
                      <Icon className="h-4 w-4 text-secondary-foreground" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{n.body}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
              );
              return n.room_id ? (
                <Link
                  key={n.id}
                  to="/room/$roomId"
                  params={{ roomId: n.room_id }}
                  className="block border-b last:border-0"
                >
                  {inner}
                </Link>
              ) : (
                <div key={n.id} className="border-b last:border-0">
                  {inner}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
