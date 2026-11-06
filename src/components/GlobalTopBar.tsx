import { Link } from "@tanstack/react-router";
import { Bell, ClipboardCheck, Crown, Gift, Medal, Plus, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/rooms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsBell } from "@/components/NotificationsBell";

export function GlobalTopBar({ compact = false }: { compact?: boolean }) {
  const { user, profile } = useAuth();
  return (
    <>
      <header className={`global-hud ${compact ? "global-hud-compact" : ""}`}>
        <div className="global-hud-inner">
          <Link to="/profile/$userId" params={{ userId: user?.id ?? "" }} className="hud-profile">
            <Avatar className="h-10 w-10 border-2 border-white/50 shadow-lg">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback>{initials(profile?.display_name ?? "P")}</AvatarFallback>
            </Avatar>
            {!compact ? (
              <span className="hidden min-w-0 sm:block">
                <b className="block max-w-28 truncate text-xs">
                  {profile?.display_name ?? "Player"}
                </b>
                <small className="text-white/60">
                  Lv. {Math.max(1, Math.floor((profile?.coins ?? 0) / 1000))}
                </small>
              </span>
            ) : null}
          </Link>
          <div className="hud-brand">
            <span className="hud-brand-mark">W</span>
            <span className="hidden sm:inline">WePlay</span>
          </div>
          <div className="hud-actions">
            <Link to="/wallet" className="hud-gold">
              <Gift className="h-4 w-4 text-gold" />
              <span>{(profile?.coins ?? 0).toLocaleString()}</span>
              <Plus className="h-3 w-3" />
            </Link>
            <Link to="/ranking" className="hud-icon" aria-label="Ranking">
              <Crown className="h-4 w-4" />
            </Link>
            <Link to="/tasks" className="hud-icon" aria-label="Tasks">
              <ClipboardCheck className="h-4 w-4" />
            </Link>
            <Link to="/discover" className="hud-icon" aria-label="Friends">
              <Users className="h-4 w-4" />
            </Link>
            <NotificationsBell />
          </div>
        </div>
        <div className="hud-ticker">
          <span className="hud-ticker-pulse" />{" "}
          <span className="font-bold text-gold">10K GOLD</span> Red Packet is dropping in Popular
          Voice Rooms{" "}
          <Link to="/" className="ml-auto font-bold text-white underline">
            Enter
          </Link>
        </div>
      </header>
      {!compact ? (
        <Link to="/wallet" className="gift-pack-float">
          <span className="gift-pack-icon">
            <Gift className="h-5 w-5" />
          </span>
          <span>
            <b className="block text-[11px]">Gift Pack</b>
            <small className="text-[10px] text-muted-foreground">02:48 left</small>
          </span>
          <Medal className="ml-auto h-4 w-4 text-gold" />
        </Link>
      ) : null}
    </>
  );
}
