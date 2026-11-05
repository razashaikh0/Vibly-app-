import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security & Safety — Account, Rooms and Coins" },
      {
        name: "description",
        content:
          "How accounts, coins and voice rooms are protected: OTP limits, spam throttles, moderation tools and reporting.",
      },
      { property: "og:title", content: "Security & Safety — Account, Rooms and Coins" },
      {
        property: "og:description",
        content: "Account protection, anti-spam throttles, room moderation and how to report abuse.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SecurityPage,
});

const ITEMS = [
  {
    title: "Account protection",
    body: "Sign-in supports email, phone OTP and Google. OTP requests are rate limited with a 60 second cooldown, an hourly cap per number, and five verification attempts before the flow resets.",
  },
  {
    title: "Server-side coin safety",
    body: "Gifts, red packets and rewards are processed by atomic database transactions. Balances can never go negative and a failed transfer rolls back completely.",
  },
  {
    title: "Anti-spam throttles",
    body: "Red packets are limited to one per 30 seconds, large gifts to five per minute and VIP entry effects to one per 10 minutes, per member. Duplicate animation triggers are ignored using server-side dedupe keys.",
  },
  {
    title: "Room moderation",
    body: "Hosts can mute, remove and lock seats. Any member can block or report another member; reports include the room, time and reason and stay in the moderation history.",
  },
  {
    title: "Data access rules",
    body: "Every table uses row-level security, so a member can only read or change the records they are allowed to. Private fields such as phone numbers are never exposed through the public API.",
  },
  {
    title: "Report abuse",
    body: "Long-press a member in a room, or open their profile, and choose Report. Serious cases are actioned within 24 hours.",
  },
];

function SecurityPage() {
  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <header className="app-header px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Link to="/me" aria-label="Back" className="rounded-full p-1.5">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Security</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-2.5 px-4 py-4">
        <div className="surface-card flex items-center gap-2.5 rounded-2xl p-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">
            Your rooms, coins and account are protected by server-side rules — not by the app on your phone.
          </p>
        </div>
        {ITEMS.map((s) => (
          <section key={s.title} className="surface-card rounded-2xl p-3">
            <h2 className="text-sm font-bold">{s.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
        <Link to="/privacy" className="chip block px-3 py-2 text-center text-xs font-semibold">
          Read the Privacy Policy
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
