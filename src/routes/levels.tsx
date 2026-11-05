import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/levels")({
  head: () => ({
    meta: [
      { title: "Charm & Active Levels — Growth Explained" },
      {
        name: "description",
        content:
          "Understand charm levels, active levels, how gifts convert to charm and how room time converts to experience.",
      },
      { property: "og:title", content: "Charm & Active Levels — Growth Explained" },
      {
        property: "og:description",
        content: "Charm from received gifts, active levels from room time. Full milestone tables.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LevelsPage,
});

const CHARM_TIERS = [
  { charm: 1_000, icon: "⭐", title: "Rising" },
  { charm: 4_000, icon: "💎", title: "Shining" },
  { charm: 12_000, icon: "👑", title: "Radiant" },
  { charm: 50_000, icon: "🔥", title: "Iconic" },
  { charm: 200_000, icon: "🏆", title: "Legend" },
  { charm: 1_000_000, icon: "🌌", title: "Mythic" },
];

const ACTIVE_TIERS = [
  { exp: 5_000, label: "Lv.1 — Newcomer" },
  { exp: 20_000, label: "Lv.2 — Regular" },
  { exp: 60_000, label: "Lv.3 — Host" },
  { exp: 150_000, label: "Lv.4 — Veteran" },
  { exp: 400_000, label: "Lv.5 — Elite" },
];

function LevelsPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<"charm" | "active">("charm");
  const charm = profile?.coins ?? 0;
  const next = CHARM_TIERS.find((t) => t.charm > charm) ?? CHARM_TIERS[CHARM_TIERS.length - 1]!;
  const pct = Math.min(100, (charm / next.charm) * 100);

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <header className="app-header px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Link to="/me" aria-label="Back" className="rounded-full p-1.5">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Levels</h1>
        </div>
        <div className="mx-auto mt-3 flex max-w-lg gap-2 text-xs font-semibold">
          {(["charm", "active"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`chip px-3 py-1 ${tab === k ? "ring-2 ring-primary/40" : "opacity-70"}`}
            >
              {k === "charm" ? "Charm Levels" : "Active Levels"}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <section className="surface-card rounded-2xl p-3">
          <p className="text-sm font-bold">{profile?.display_name ?? "Guest"}</p>
          <p className="text-[11px] text-muted-foreground">Charm: {charm.toLocaleString()}</p>
          <Progress value={pct} className="mt-2 h-1.5" />
          <p className="mt-1 text-[11px] text-muted-foreground">
            {Math.max(0, next.charm - charm).toLocaleString()} charm to {next.title} {next.icon}
          </p>
        </section>

        {tab === "charm" ? (
          <>
            <section className="surface-card rounded-2xl p-3">
              <h2 className="text-sm font-bold">How charm works</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Charm shows how popular a member is. Every 5 coins worth of gifts you receive equals 1 charm. When
                you speak in a room, your current charm icon appears next to your nickname.
              </p>
            </section>
            <section className="surface-card rounded-2xl p-3">
              <h2 className="mb-2 text-sm font-bold">Charm milestones</h2>
              <ul className="divide-y divide-border/60 text-xs">
                {CHARM_TIERS.map((t) => (
                  <li key={t.charm} className="flex items-center justify-between py-2">
                    <span className="font-medium">
                      {t.icon} {t.title}
                    </span>
                    <span className={charm >= t.charm ? "font-bold text-primary" : "text-muted-foreground"}>
                      {t.charm.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <>
            <section className="surface-card rounded-2xl p-3">
              <h2 className="text-sm font-bold">How active levels work</h2>
              <ul className="mt-1 space-y-1 text-xs leading-relaxed text-muted-foreground">
                <li>5 minutes in a voice room = 5 EXP (doubled for VIP members).</li>
                <li>10 coins of gifts or red packets sent = 1 EXP.</li>
                <li>Room experience is recalculated hourly; locked rooms do not count.</li>
                <li>A single room can earn at most 55,000 EXP per day.</li>
              </ul>
            </section>
            <section className="surface-card rounded-2xl p-3">
              <h2 className="mb-2 text-sm font-bold">Active milestones</h2>
              <ul className="divide-y divide-border/60 text-xs">
                {ACTIVE_TIERS.map((t) => (
                  <li key={t.exp} className="flex items-center justify-between py-2">
                    <span className="font-medium">{t.label}</span>
                    <span className="text-muted-foreground">{t.exp.toLocaleString()} EXP</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
