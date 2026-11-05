/**
 * Shared level maths for charm (gift value received / coin power) and the
 * visual frame tiers used on mic seats, profiles and the shop.
 * Mirrors the tables shown on /levels so every surface agrees.
 */

export type FrameTier = {
  /** minimum charm required */
  charm: number;
  level: number;
  title: string;
  icon: string;
  /** conic-gradient stops used for the animated seat frame */
  ring: string;
  /** solid tint for the small charm badge */
  badge: string;
};

export const FRAME_TIERS: FrameTier[] = [
  {
    charm: 0,
    level: 0,
    title: "Newcomer",
    icon: "🌱",
    ring: "conic-gradient(from 0deg, oklch(0.72 0.06 268), oklch(0.86 0.03 268), oklch(0.72 0.06 268))",
    badge: "oklch(0.72 0.06 268)",
  },
  {
    charm: 1_000,
    level: 1,
    title: "Rising",
    icon: "⭐",
    ring: "conic-gradient(from 0deg, oklch(0.62 0.16 250), oklch(0.86 0.10 220), oklch(0.62 0.16 250))",
    badge: "oklch(0.62 0.16 250)",
  },
  {
    charm: 4_000,
    level: 2,
    title: "Shining",
    icon: "💎",
    ring: "conic-gradient(from 0deg, oklch(0.66 0.14 190), oklch(0.90 0.09 175), oklch(0.66 0.14 190))",
    badge: "oklch(0.66 0.14 190)",
  },
  {
    charm: 12_000,
    level: 3,
    title: "Radiant",
    icon: "👑",
    ring: "conic-gradient(from 0deg, oklch(0.72 0.14 78), oklch(0.93 0.09 95), oklch(0.72 0.14 78))",
    badge: "oklch(0.72 0.14 78)",
  },
  {
    charm: 50_000,
    level: 4,
    title: "Iconic",
    icon: "🔥",
    ring: "conic-gradient(from 0deg, oklch(0.62 0.20 25), oklch(0.86 0.14 60), oklch(0.62 0.20 25))",
    badge: "oklch(0.62 0.20 25)",
  },
  {
    charm: 200_000,
    level: 5,
    title: "Legend",
    icon: "🏆",
    ring: "conic-gradient(from 0deg, oklch(0.48 0.20 300), oklch(0.86 0.14 330), oklch(0.62 0.18 268), oklch(0.48 0.20 300))",
    badge: "oklch(0.55 0.20 300)",
  },
  {
    charm: 1_000_000,
    level: 6,
    title: "Mythic",
    icon: "🌌",
    ring: "conic-gradient(from 0deg, oklch(0.38 0.16 268), oklch(0.90 0.12 95), oklch(0.62 0.20 330), oklch(0.38 0.16 268))",
    badge: "oklch(0.38 0.16 268)",
  },
];

export function frameTier(charm: number): FrameTier {
  let tier = FRAME_TIERS[0]!;
  for (const t of FRAME_TIERS) if (charm >= t.charm) tier = t;
  return tier;
}

export function nextFrameTier(charm: number): FrameTier | null {
  return FRAME_TIERS.find((t) => t.charm > charm) ?? null;
}

/** Progress (0-100) towards the next charm tier. */
export function charmProgress(charm: number): number {
  const cur = frameTier(charm);
  const next = nextFrameTier(charm);
  if (!next) return 100;
  const span = next.charm - cur.charm;
  return Math.min(100, Math.max(0, ((charm - cur.charm) / span) * 100));
}

/** Active EXP level from total minutes spent on mic. */
export function activeLevel(exp: number): number {
  const steps = [5_000, 20_000, 60_000, 150_000, 400_000];
  return steps.filter((s) => exp >= s).length;
}

/** Human "kitne din se" label for a relationship / account start date. */
export function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function togetherLabel(iso: string | null | undefined): string {
  const d = daysSince(iso);
  if (d < 1) return "Today";
  if (d < 30) return `${d} days`;
  if (d < 365) return `${Math.floor(d / 30)} months ${d % 30} days`;
  return `${Math.floor(d / 365)} years ${Math.floor((d % 365) / 30)} months`;
}
