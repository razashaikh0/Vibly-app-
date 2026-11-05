import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Gauge, Volume2, Vibrate } from "lucide-react";
import { useFxSettings } from "@/lib/fxSettings";
import { Switch } from "@/components/ui/switch";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/effects")({
  head: () => ({
    meta: [
      { title: "Room Animations — Effects Settings" },
      {
        name: "description",
        content:
          "Turn room celebration animations on or off and switch on lite mode to throttle effects on low-end devices.",
      },
      { property: "og:title", content: "Room Animations — Effects Settings" },
      {
        property: "og:description",
        content: "Control red packet, luxury gift and VIP entry animations on your device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EffectsPage,
});

function EffectsPage() {
  const { settings, update } = useFxSettings();

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <header className="glass sticky top-0 z-20 flex items-center gap-3 px-4 py-3">
        <Link to="/me" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-bold">Room Animations</h1>
      </header>

      <main className="mx-auto max-w-lg space-y-3 px-4 py-5">
        <div className="glass flex items-center gap-3 rounded-2xl px-4 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl royal-gradient">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Celebration animations</p>
            <p className="text-xs text-muted-foreground">
              Lucky Red Packet, luxury gift and VIP entry banners.
            </p>
          </div>
          <Switch
            checked={settings.animations}
            onCheckedChange={(v) => update({ animations: v })}
            aria-label="Enable celebration animations"
          />
        </div>

        <div className="glass flex items-center gap-3 rounded-2xl px-4 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl sky-gradient">
            <Gauge className="h-5 w-5 text-primary-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Lite mode (low-end devices)</p>
            <p className="text-xs text-muted-foreground">
              No particles, one banner at a time, shorter duration.
            </p>
          </div>
          <Switch
            checked={settings.lite}
            disabled={!settings.animations}
            onCheckedChange={(v) => update({ lite: v })}
            aria-label="Enable lite animation mode"
          />
        </div>

        <div className="glass flex items-center gap-3 rounded-2xl px-4 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl gold-gradient">
            <Volume2 className="h-5 w-5 text-primary-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Effect sounds</p>
            <p className="text-xs text-muted-foreground">
              Short chime when a red packet, luxury gift or VIP entry lands.
            </p>
          </div>
          <Switch
            checked={settings.sound}
            onCheckedChange={(v) => update({ sound: v })}
            aria-label="Enable effect sounds"
          />
        </div>

        <div className="glass flex items-center gap-3 rounded-2xl px-4 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl mint-gradient">
            <Vibrate className="h-5 w-5 text-primary-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Haptics (vibration)</p>
            <p className="text-xs text-muted-foreground">
              Buzz your phone when an effect fires. Ignored on devices without vibration.
            </p>
          </div>
          <Switch
            checked={settings.haptics}
            onCheckedChange={(v) => update({ haptics: v })}
            aria-label="Enable effect haptics"
          />
        </div>

        <p className="px-1 text-xs text-muted-foreground">
          These settings only change what you see. Coins, gifts and red packets are still sent and
          recorded normally, and the room activity feed keeps every event.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
