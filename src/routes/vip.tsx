import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Crown, Gem, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/vip")({
  head: () => ({
    meta: [
      { title: "VIP Center — VoicePal" },
      { name: "description", content: "Choose a VoicePal VIP monthly, quarterly or yearly plan." },
    ],
  }),
  component: VipPage,
});

const PLANS = [
  { name: "Monthly", duration: "30 days", price: "₹299", tone: "from-primary/30 to-transparent" },
  {
    name: "Quarterly",
    duration: "90 days",
    price: "₹799",
    tone: "from-accent/35 to-transparent",
    popular: true,
  },
  { name: "Yearly", duration: "365 days", price: "₹2,499", tone: "from-gold/35 to-transparent" },
];

const BENEFITS = [
  "VIP profile badge and frame",
  "Room entry effect and name styling",
  "VIP gift collection access",
  "Priority family and room privileges",
  "VIP-only profile showcase",
];

function VipPage() {
  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <header className="glass sticky top-0 z-20 flex items-center gap-2 px-3 py-3">
        <Button size="icon" variant="ghost" asChild aria-label="Back">
          <Link to="/me">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold">VIP Center</h1>
        <Crown className="h-5 w-5 text-gold" />
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <section className="royal-gradient rounded-3xl p-5 text-primary-foreground">
          <div className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-gold" />
            <span className="text-eyebrow">PREMIUM MEMBERSHIP</span>
          </div>
          <h2 className="mt-3 text-2xl font-black">Stand out in every room.</h2>
          <p className="mt-1 text-sm opacity-80">
            VIP is purchased with real money and is separate from gaming coins.
          </p>
        </section>

        <div className="space-y-3">
          {PLANS.map((plan) => (
            <button
              key={plan.name}
              type="button"
              onClick={() => toast("Payment gateway setup is required before VIP checkout")}
              className={`relative w-full rounded-2xl bg-gradient-to-br ${plan.tone} surface-card p-4 text-left transition hover:ring-2 hover:ring-primary/30`}
            >
              {plan.popular ? (
                <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
                  POPULAR
                </span>
              ) : null}
              <p className="text-base font-black">VIP {plan.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{plan.duration} access</p>
              <p className="mt-3 text-2xl font-black text-gold">{plan.price}</p>
            </button>
          ))}
        </div>

        <section className="surface-card rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold">Included with VIP</p>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                {benefit}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
