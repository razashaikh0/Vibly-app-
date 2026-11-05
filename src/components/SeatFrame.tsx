import { frameTier } from "@/lib/levels";

/**
 * Animated avatar frame for mic seats and profiles.
 * The ring colour + spin speed come from the member's charm tier, so a
 * higher level literally looks richer without any extra images.
 */
export function SeatFrame({
  charm,
  size = 72,
  speaking = false,
  children,
}: {
  charm: number;
  size?: number | undefined;
  speaking?: boolean | undefined;
  children: React.ReactNode;
}) {
  const tier = frameTier(charm);
  const duration = Math.max(2.5, 8 - tier.level) + "s";

  return (
    <span
      className="relative grid place-items-center rounded-full"
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background: tier.ring,
          animation: `frame-spin ${duration} linear infinite`,
          opacity: tier.level === 0 ? 0.55 : 1,
          filter: speaking ? "saturate(1.3) brightness(1.1)" : undefined,
        }}
      />
      <span
        aria-hidden
        className="absolute rounded-full bg-card"
        style={{ inset: tier.level >= 3 ? 3 : 2 }}
      />
      {tier.level >= 2 && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ animation: "frame-shine 3.2s ease-in-out infinite" }}
        />
      )}
      <span className="relative grid place-items-center">{children}</span>
    </span>
  );
}

/** Small charm badge (icon + level) shown under a seat. */
export function CharmBadge({ charm, className = "" }: { charm: number; className?: string }) {
  const tier = frameTier(charm);
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px] text-[9px] font-bold text-white ${className}`}
      style={{ background: tier.badge }}
      title={`${tier.title} — charm level ${tier.level}`}
    >
      <span>{tier.icon}</span>
      <span>Lv.{tier.level}</span>
    </span>
  );
}

/** Speaking wave indicator — three animated bars in the brand palette. */
export function WaveIndicator({ active }: { active: boolean | undefined }) {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-primary"
          style={{
            height: active ? "100%" : "25%",
            animation: active ? `wave-bar 0.9s ease-in-out ${i * 0.15}s infinite` : undefined,
            opacity: active ? 1 : 0.3,
          }}
        />
      ))}
    </span>
  );
}
