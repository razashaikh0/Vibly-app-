/**
 * Client-side OTP throttling: resend cooldown + hourly send limit per phone.
 * Server-side Supabase rate limits still apply; this keeps the UX stable and
 * prevents obvious SMS abuse from the app itself.
 */

const COOLDOWN_MS = 60_000; // 60s between sends
const WINDOW_MS = 60 * 60_000; // 1 hour window
const MAX_PER_WINDOW = 5; // max OTP sends per phone per hour

type Record_ = { last: number; stamps: number[] };

const KEY = "wevoice.otp.guard";

function readAll(): Record<string, Record_> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Record<string, Record_>;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, Record_>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota errors */
  }
}

function entry(phone: string): Record_ {
  const all = readAll();
  return all[phone] ?? { last: 0, stamps: [] };
}

export type OtpGuardCheck =
  | { ok: true }
  | { ok: false; reason: "cooldown"; secondsLeft: number }
  | { ok: false; reason: "limit"; minutesLeft: number };

export function checkOtpAllowed(phone: string, now = Date.now()): OtpGuardCheck {
  const rec = entry(phone);
  const since = now - rec.last;
  if (rec.last && since < COOLDOWN_MS) {
    return { ok: false, reason: "cooldown", secondsLeft: Math.ceil((COOLDOWN_MS - since) / 1000) };
  }
  const recent = rec.stamps.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    const oldest = Math.min(...recent);
    return {
      ok: false,
      reason: "limit",
      minutesLeft: Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 60_000)),
    };
  }
  return { ok: true };
}

export function recordOtpSent(phone: string, now = Date.now()) {
  const all = readAll();
  const rec = all[phone] ?? { last: 0, stamps: [] };
  rec.last = now;
  rec.stamps = [...rec.stamps.filter((t) => now - t < WINDOW_MS), now];
  all[phone] = rec;
  writeAll(all);
}

export function cooldownRemaining(phone: string, now = Date.now()): number {
  const rec = entry(phone);
  if (!rec.last) return 0;
  return Math.max(0, Math.ceil((COOLDOWN_MS - (now - rec.last)) / 1000));
}

export function sendsLeft(phone: string, now = Date.now()): number {
  const rec = entry(phone);
  return Math.max(0, MAX_PER_WINDOW - rec.stamps.filter((t) => now - t < WINDOW_MS).length);
}

export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("+")) return "+" + trimmed.slice(1).replace(/\D/g, "");
  return `+91${trimmed.replace(/\D/g, "")}`;
}

export const OTP_LIMITS = { COOLDOWN_MS, WINDOW_MS, MAX_PER_WINDOW };
