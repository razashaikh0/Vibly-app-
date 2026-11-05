import { useEffect, useState } from "react";

export type FxSettings = {
  /** Show celebration animations at all (coins/gift logic is unaffected). */
  animations: boolean;
  /** Low-end device mode: no particles, one banner at a time, shorter duration. */
  lite: boolean;
  /** Play a short chime when a celebration banner appears. */
  sound: boolean;
  /** Vibrate the device when a celebration banner appears (mobile only). */
  haptics: boolean;
};

const KEY = "vibely.fx.settings";
const EVENT = "vibely-fx-settings";

const DEFAULTS: FxSettings = { animations: true, lite: false, sound: true, haptics: true };

export function readFxSettings(): FxSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<FxSettings>;
    return {
      animations: parsed.animations !== false,
      lite: parsed.lite === true,
      sound: parsed.sound !== false,
      haptics: parsed.haptics !== false,
    };
  } catch {
    return DEFAULTS;
  }
}

export function writeFxSettings(next: FxSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Live-updating access to the effects preferences. */
export function useFxSettings() {
  const [settings, setSettings] = useState<FxSettings>(DEFAULTS);

  useEffect(() => {
    const sync = () => setSettings(readFxSettings());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (patch: Partial<FxSettings>) => {
    const next = { ...readFxSettings(), ...patch };
    writeFxSettings(next);
    setSettings(next);
  };

  return { settings, update };
}

/** Short WebAudio chime; silent failure when audio is blocked by the browser. */
export function playFxChime(kind: string) {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = kind === "big_gift" ? [660, 880, 1180] : kind === "vip_entry" ? [520, 780] : [880, 660];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.24);
    });
    window.setTimeout(() => void ctx.close(), 900);
  } catch {
    /* audio unavailable */
  }
}

/** Vibration pattern per effect kind; no-op where unsupported. */
export function playFxHaptic(kind: string) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(kind === "big_gift" ? [30, 40, 60] : kind === "vip_entry" ? [20, 30, 20] : 40);
  } catch {
    /* vibration unavailable */
  }
}
