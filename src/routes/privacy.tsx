import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Voice Rooms Data & Choices" },
      {
        name: "description",
        content:
          "How we collect, use and protect your account, voice room and payment data, and how you can control or delete it.",
      },
      { property: "og:title", content: "Privacy Policy — Voice Rooms Data & Choices" },
      {
        property: "og:description",
        content: "What data we store, why we store it, who can see it, and how to delete your account.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS = [
  {
    title: "1. What we collect",
    body: "Account basics (display name, avatar, bio, phone or email used to sign in), in-app activity (rooms joined, mic seat time, chat messages, gifts and coin transactions) and device signals needed to keep audio stable, such as connection quality.",
  },
  {
    title: "2. Why we collect it",
    body: "To run voice rooms and seats, show levels, charm and rankings, deliver gift and entry animations, prevent spam or abuse, and answer support requests.",
  },
  {
    title: "3. Voice audio",
    body: "Live room audio streams peer-to-peer between participants and is not recorded or stored by us. Text chat and system events are stored so activity feeds and moderation history work.",
  },
  {
    title: "4. What others can see",
    body: "Your display name, avatar, level, charm tier, badges, family and public room activity are visible to other members. Your phone number and email are never shown to other members.",
  },
  {
    title: "5. Coins and purchases",
    body: "Coin balances and gift transactions are stored to keep balances correct. Card details are handled by the payment provider and never reach our servers.",
  },
  {
    title: "6. Your controls",
    body: "You can edit your profile, block or report members, turn room animations, sound and haptics off, change your phone number, and delete your account from Settings. Deleting the account removes your profile, seats, messages and family membership.",
  },
  {
    title: "7. Children",
    body: "The app is not intended for anyone under 18. Accounts identified as minors are removed.",
  },
  {
    title: "8. Contact",
    body: "For any privacy request, use Settings → Support inside the app. We answer data requests within 30 days.",
  },
];

function PrivacyPage() {
  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <header className="app-header px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Link to="/me" aria-label="Back" className="rounded-full p-1.5">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Privacy Policy</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-2.5 px-4 py-4">
        <p className="text-[11px] text-muted-foreground">Last updated: 26 August 2026</p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="surface-card rounded-2xl p-3">
            <h2 className="text-sm font-bold">{s.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
        <Link to="/security" className="chip block px-3 py-2 text-center text-xs font-semibold">
          Read the Security overview
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
