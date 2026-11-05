export type RoomRow = {
  id: string;
  name: string;
  topic: string | null;
  cover_emoji: string;
  theme: string;
  host_id: string;
  seat_count: number;
  is_live: boolean;
  created_at: string;
};

export type MiniProfile = {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  coins?: number | null;
};

export type SeatRow = {
  id: string;
  room_id: string;
  seat_index: number;
  user_id: string | null;
  is_muted: boolean;
  is_locked: boolean;
  profiles?: MiniProfile | null;
};

export type MessageRow = {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  kind: string;
  created_at: string;
  profiles?: MiniProfile | null;
};

export type GiftRow = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  tier: string;
};

export const THEMES: Record<string, string> = {
  violet: "from-primary/25 via-primary-glow/20 to-transparent",
  ocean: "from-chart-4/30 via-primary/15 to-transparent",
  sunset: "from-gold/35 via-accent/20 to-transparent",
  forest: "from-chart-5/28 via-chart-4/18 to-transparent",
};

export const EMOJIS = ["🎧", "🎤", "🎮", "🎶", "💬", "🔥", "🌙", "🌈", "⚡", "🎲"];

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function themeGradient(theme: string) {
  return THEMES[theme] ?? "from-fuchsia-500/30 via-violet-500/20 to-transparent";
}
