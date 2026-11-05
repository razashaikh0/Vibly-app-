import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rowToFx, vipTier, type FxEvent, type FxRow } from "@/lib/fx";
import { playFxChime, playFxHaptic, useFxSettings } from "@/lib/fxSettings";

/**
 * Ids already played in this tab. The server assigns one row (and one id) per
 * effect, so a reconnect that replays inserts can never animate twice.
 */
const played = new Set<string>();

/** Ignore records older than this — reconnects should not replay history. */
const FRESH_MS = 20000;

function BannerCard({ evt, lite }: { evt: FxEvent; lite: boolean }) {
  if (evt.kind === "red_packet") {
    return (
      <div className="fx-banner ember-gradient">
        <div className="flex items-center gap-3">
          <span
            className="text-3xl"
            style={lite ? undefined : { animation: "fx-shake 0.6s ease-in-out infinite" }}
          >
            🧧
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-90">
              {evt.scope === "global" ? "Server · Lucky Red Packet" : "Lucky Red Packet"}
            </p>
            <p className="truncate text-sm font-semibold">
              {evt.actorName} dropped {(evt.amount ?? 0).toLocaleString()} coins in{" "}
              {evt.roomName ?? "a room"}
            </p>
          </div>
        </div>
        {lite ? null : (
          <div className="pointer-events-none absolute inset-0">
            {[10, 30, 50, 70, 90].map((left, i) => (
              <span
                key={left}
                className="absolute text-lg"
                style={{
                  left: `${left}%`,
                  top: "-20px",
                  animation: `fx-rain 1.8s linear ${i * 0.25}s infinite`,
                }}
              >
                🧧
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (evt.kind === "big_gift") {
    return (
      <div className="fx-banner royal-gradient">
        <div className="flex items-center gap-3">
          <span className="text-4xl" style={lite ? undefined : { animation: "fx-pop 1s ease-out" }}>
            {evt.emoji ?? "🎁"}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-90">
              {evt.scope === "global" ? "Server · Luxury Gift" : "Luxury Gift"}
            </p>
            <p className="truncate text-sm font-semibold">
              {evt.actorName} sent {evt.giftName} to {evt.targetName ?? "themselves"}
            </p>
            <p className="text-[11px] opacity-90">
              {(evt.amount ?? 0).toLocaleString()} coins · {evt.roomName ?? "voice room"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tier = vipTier(evt.vipLevel ?? 1);
  return (
    <div
      className={`fx-banner ${tier?.gradient ?? "sky-gradient"}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl" style={lite ? undefined : { animation: "fx-pop 0.9s ease-out" }}>
          {tier?.emoji ?? "✨"}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-90">
            {tier?.name ?? "VIP"} Lv.{evt.vipLevel} entry
          </p>
          <p className="truncate text-sm font-semibold">
            {evt.actorName} entered {evt.roomName ?? "the room"}
          </p>
        </div>
      </div>
      {lite ? null : (
        <div
          className="pointer-events-none absolute inset-0 bg-primary-foreground/25"
          style={{ animation: "fx-sweep 1.6s ease-out" }}
        />
      )}
    </div>
  );
}

/**
 * Renders celebration banners from the server-side effect log.
 * Pass a roomId for room-scoped effects, or nothing for the server-wide feed.
 */
export function FxOverlay({ roomId }: { roomId?: string }) {
  const [queue, setQueue] = useState<FxEvent[]>([]);
  const { settings } = useFxSettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const channelName = roomId ? `fx-room-${roomId}` : "fx-global";
    const ch = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_fx_events",
          ...(roomId ? { filter: `room_id=eq.${roomId}` } : {}),
        },
        ({ new: row }) => {
          const evt = rowToFx(row as FxRow);
          if (!roomId && evt.scope !== "global") return;
          if (played.has(evt.id)) return;
          if (Date.now() - evt.createdAt > FRESH_MS) return;
          played.add(evt.id);
          if (settingsRef.current.sound) playFxChime(evt.kind);
          if (settingsRef.current.haptics) playFxHaptic(evt.kind);
          if (!settingsRef.current.animations) return;

          const lite = settingsRef.current.lite;
          setQueue((prev) => [...prev, evt].slice(lite ? -1 : -3));
          window.setTimeout(
            () => setQueue((prev) => prev.filter((e) => e.id !== evt.id)),
            lite ? 2600 : 5200,
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [roomId]);

  if (!settings.animations || queue.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-[70] flex flex-col items-center gap-2 px-3">
      {queue.map((evt) => (
        <div
          key={evt.id}
          className="w-full max-w-md"
          style={settings.lite ? undefined : { animation: "fx-slide-in 0.45s ease-out" }}
        >
          <BannerCard evt={evt} lite={settings.lite} />
        </div>
      ))}
    </div>
  );
}
