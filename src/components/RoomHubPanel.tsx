import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Users } from "lucide-react";
import { GiftWallPanel } from "@/components/GiftWallPanel";
import { RoomMemberRanking } from "@/components/RoomMemberRanking";
import { RoomActivityFeed } from "@/components/RoomActivityFeed";

type Tab = "wall" | "members" | "bonds" | "activity";

/**
 * Single in-room hub: gift wall, member ranking, bonds (CP) and the live
 * activity feed in one place, so nothing has to be opened from a profile page.
 */
export function RoomHubPanel({
  roomId,
  memberIds,
  onGift,
  initialTab = "wall",
}: {
  roomId: string;
  memberIds: string[];
  onGift?: ((user: { id: string; name: string }) => void) | undefined;
  initialTab?: Tab | undefined;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { key: "wall", label: "🎁 Gift wall" },
            { key: "members", label: "🏆 Members" },
            { key: "bonds", label: "💞 Bonds" },
            { key: "activity", label: "⏱ Activity" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "wall" ? (
        <GiftWallPanel roomId={roomId} />
      ) : tab === "members" ? (
        <RoomMemberRanking roomId={roomId} memberIds={memberIds} onGift={onGift} />
      ) : tab === "activity" ? (
        <RoomActivityFeed roomId={roomId} />
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Bonds show how long you have been paired with your CP and how many guard points you
            have given each other.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              to="/cp"
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-semibold hover:bg-primary/15"
            >
              <Heart className="h-3.5 w-3.5 text-primary" /> CP &amp; guard timeline
            </Link>
            <Link
              to="/family"
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-semibold hover:bg-primary/15"
            >
              <Users className="h-3.5 w-3.5 text-primary" /> Family weekly ranking
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
