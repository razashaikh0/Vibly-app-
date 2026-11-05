import { supabase } from "@/integrations/supabase/client";

export type FxKind = "red_packet" | "big_gift" | "vip_entry";

/** A celebration effect, exactly as it was recorded on the server. */
export type FxEvent = {
  id: string;
  kind: FxKind;
  scope: "global" | "room";
  roomId: string;
  roomName?: string | null;
  actorName: string;
  actorAvatar?: string | null;
  targetName?: string | null;
  emoji?: string | null;
  giftName?: string | null;
  amount?: number | null;
  vipLevel?: number | null;
  createdAt: number;
};

/** Gifts worth this many coins (or more) trigger a server-wide animation. */
export const GLOBAL_GIFT_THRESHOLD = 40000;

/** VIP tiers unlock progressively fancier room-entry animations. */
export type VipTier = {
  level: number;
  name: string;
  emoji: string;
  gradient: string;
  /** Tier at or above this level also broadcasts server-wide. */
  global: boolean;
};

export const VIP_TIERS: VipTier[] = [
  { level: 1, name: "VIP", emoji: "✨", gradient: "sky-gradient", global: false },
  { level: 2, name: "Silver VIP", emoji: "💠", gradient: "mint-gradient", global: false },
  { level: 3, name: "Gold VIP", emoji: "👑", gradient: "gold-gradient", global: false },
  { level: 4, name: "Diamond VIP", emoji: "💎", gradient: "royal-gradient", global: true },
  { level: 5, name: "Supreme VIP", emoji: "🔥", gradient: "ember-gradient", global: true },
];

/** Mirror of the server-side vip_level_for() thresholds. */
export function vipLevelFromCoins(coins: number): number {
  if (coins >= 500000) return 5;
  if (coins >= 200000) return 4;
  if (coins >= 80000) return 3;
  if (coins >= 30000) return 2;
  if (coins >= 10000) return 1;
  return 0;
}

export function vipTier(level: number): VipTier | null {
  return VIP_TIERS.find((t) => t.level === level) ?? null;
}

/** Shape of a row from public.room_fx_events. */
export type FxRow = {
  id: string;
  room_id: string;
  kind: string;
  scope: string;
  actor_name: string;
  actor_avatar: string | null;
  room_name: string | null;
  target_name: string | null;
  gift_name: string | null;
  emoji: string | null;
  amount: number | string | null;
  vip_level: number | null;
  created_at: string;
};

export function rowToFx(row: FxRow): FxEvent {
  return {
    id: row.id,
    kind: row.kind as FxKind,
    scope: row.scope === "global" ? "global" : "room",
    roomId: row.room_id,
    roomName: row.room_name,
    actorName: row.actor_name,
    actorAvatar: row.actor_avatar,
    targetName: row.target_name,
    giftName: row.gift_name,
    emoji: row.emoji,
    amount: row.amount == null ? null : Number(row.amount),
    vipLevel: row.vip_level,
    createdAt: new Date(row.created_at).getTime(),
  };
}

/**
 * Ask the server to record a VIP entry animation. The level is derived from the
 * caller's *current* coin balance server-side, and the insert is idempotent, so
 * reconnecting clients can call this safely — a level-up mid-session produces a
 * new (higher tier) animation, a repeat entry at the same level does not.
 */
export async function recordVipEntry(roomId: string) {
  const { error } = await supabase.rpc("record_vip_entry", { _room_id: roomId });
  if (error) console.warn("vip entry fx skipped", error.message);
}

export function fxLabel(evt: FxEvent): string {
  if (evt.kind === "red_packet") {
    return `${evt.actorName} dropped a Lucky Red Packet of ${(evt.amount ?? 0).toLocaleString()} coins`;
  }
  if (evt.kind === "big_gift") {
    return `${evt.actorName} sent ${evt.giftName} to ${evt.targetName ?? "themselves"} (${(evt.amount ?? 0).toLocaleString()} coins)`;
  }
  const tier = vipTier(evt.vipLevel ?? 1);
  return `${evt.actorName} entered as ${tier?.name ?? "VIP"} Lv.${evt.vipLevel ?? 1}`;
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
