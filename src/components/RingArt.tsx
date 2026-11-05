/**
 * Pure CSS jewellery / decoration artwork for the shop.
 * Replaces the flat emoji stickers with a real animated crystal ring:
 * metal band, faceted gem, rotating sparkle sweep and a soft glow.
 */

export type RingStyle = {
  band: string;
  gem: string;
  glow: string;
};

export const RING_STYLES: Record<string, RingStyle> = {
  unicorn: {
    band: "linear-gradient(135deg, oklch(0.92 0.05 320), oklch(0.72 0.14 300), oklch(0.95 0.04 280))",
    gem: "radial-gradient(circle at 32% 28%, #fff, oklch(0.82 0.16 330) 45%, oklch(0.55 0.20 300) 100%)",
    glow: "oklch(0.72 0.18 320)",
  },
  heart: {
    band: "linear-gradient(135deg, oklch(0.95 0.03 60), oklch(0.78 0.12 70), oklch(0.96 0.03 80))",
    gem: "radial-gradient(circle at 32% 28%, #fff, oklch(0.78 0.18 15) 45%, oklch(0.52 0.20 15) 100%)",
    glow: "oklch(0.75 0.18 15)",
  },
  crystal: {
    band: "linear-gradient(135deg, oklch(0.97 0.01 250), oklch(0.80 0.03 250), oklch(0.97 0.01 250))",
    gem: "radial-gradient(circle at 30% 26%, #fff, oklch(0.88 0.10 210) 42%, oklch(0.58 0.16 240) 100%)",
    glow: "oklch(0.78 0.14 230)",
  },
  royal: {
    band: "linear-gradient(135deg, oklch(0.93 0.09 95), oklch(0.72 0.14 78), oklch(0.95 0.08 95))",
    gem: "radial-gradient(circle at 30% 26%, #fff, oklch(0.72 0.18 268) 45%, oklch(0.38 0.16 268) 100%)",
    glow: "oklch(0.72 0.14 78)",
  },
  emerald: {
    band: "linear-gradient(135deg, oklch(0.95 0.03 140), oklch(0.76 0.10 150), oklch(0.96 0.03 140))",
    gem: "radial-gradient(circle at 30% 26%, #fff, oklch(0.80 0.16 155) 45%, oklch(0.50 0.16 160) 100%)",
    glow: "oklch(0.72 0.16 155)",
  },
};

export function RingArt({ styleKey = "crystal", size = 56 }: { styleKey?: keyof typeof RING_STYLES | string; size?: number }) {
  const s = RING_STYLES[styleKey] ?? RING_STYLES["crystal"]!;
  const band = Math.max(5, Math.round(size * 0.11));
  const gem = Math.round(size * 0.36);

  return (
    <span
      className="relative grid place-items-center"
      style={{ width: size, height: size, animation: "ring-float 3.6s ease-in-out infinite" }}
      aria-hidden
    >
      {/* glow */}
      <span
        className="absolute rounded-full"
        style={{
          inset: -4,
          background: `radial-gradient(circle, ${s.glow}55, transparent 68%)`,
          animation: "ring-glow 2.4s ease-in-out infinite",
        }}
      />
      {/* metal band */}
      <span
        className="absolute rounded-full"
        style={{
          inset: size * 0.13,
          background: s.band,
          borderRadius: "9999px",
          boxShadow: `inset 0 0 ${band}px rgba(255,255,255,0.85)`,
          WebkitMask: `radial-gradient(circle, transparent ${50 - band * 1.6}%, #000 ${50 - band * 1.6}%)`,
          mask: `radial-gradient(circle, transparent ${50 - band * 1.6}%, #000 ${50 - band * 1.6}%)`,
        }}
      />
      {/* rotating shine sweep across the band */}
      <span
        className="absolute rounded-full"
        style={{
          inset: size * 0.13,
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.95) 24deg, transparent 60deg, transparent 360deg)",
          WebkitMask: `radial-gradient(circle, transparent ${50 - band * 1.6}%, #000 ${50 - band * 1.6}%)`,
          mask: `radial-gradient(circle, transparent ${50 - band * 1.6}%, #000 ${50 - band * 1.6}%)`,
          animation: "frame-spin 2.8s linear infinite",
          mixBlendMode: "screen",
        }}
      />
      {/* gem */}
      <span
        className="absolute rounded-[30%] rotate-45"
        style={{
          width: gem,
          height: gem,
          top: size * 0.02,
          background: s.gem,
          boxShadow: `0 0 ${gem * 0.5}px ${s.glow}88`,
          animation: "gem-sparkle 2.1s ease-in-out infinite",
        }}
      />
      {/* sparkles */}
      <span className="absolute" style={{ top: 2, right: size * 0.22, animation: "sparkle-pop 2.6s ease-in-out infinite" }}>
        <Spark size={Math.round(size * 0.18)} color={s.glow} />
      </span>
      <span
        className="absolute"
        style={{ bottom: size * 0.12, left: size * 0.08, animation: "sparkle-pop 2.6s ease-in-out 1.1s infinite" }}
      >
        <Spark size={Math.round(size * 0.13)} color={s.glow} />
      </span>
    </span>
  );
}

function Spark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" fill={color} />
    </svg>
  );
}

/**
 * Animated decoration medallion for frames / mounts / entrance effects.
 * Keeps the emoji subject but wraps it in a themed animated halo.
 */
export function DecorArt({
  emoji,
  styleKey = "royal",
  size = 56,
}: {
  emoji: string;
  styleKey?: keyof typeof RING_STYLES | string;
  size?: number;
}) {
  const s = RING_STYLES[styleKey] ?? RING_STYLES["royal"]!;
  return (
    <span className="relative grid place-items-center" style={{ width: size, height: size }} aria-hidden>
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: s.band, animation: "frame-spin 6s linear infinite", opacity: 0.9 }}
      />
      <span className="absolute rounded-full bg-card" style={{ inset: 3 }} />
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${s.glow}44, transparent 70%)`, animation: "ring-glow 2.8s ease-in-out infinite" }}
      />
      <span className="relative" style={{ fontSize: size * 0.42, animation: "ring-float 3.2s ease-in-out infinite" }}>
        {emoji}
      </span>
    </span>
  );
}
