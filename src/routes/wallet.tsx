import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Coins, History, ShieldCheck, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Gaming Currency Wallet — VoicePal" },
      { name: "description", content: "Manage VoicePal coins used for gifts and family creation." },
    ],
  }),
  component: WalletPage,
});

const PACKAGES = [
  { coins: 10000, price: "₹99", bonus: "Starter" },
  { coins: 25000, price: "₹199", bonus: "Family ready" },
  { coins: 70000, price: "₹499", bonus: "+5,000 bonus" },
  { coins: 160000, price: "₹999", bonus: "+20,000 bonus" },
  { coins: 450000, price: "₹2,499", bonus: "Best value" },
  { coins: 1000000, price: "₹4,999", bonus: "+100,000 bonus" },
];

function WalletPage() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <header className="glass sticky top-0 z-20 flex items-center gap-2 px-3 py-3">
        <Button size="icon" variant="ghost" asChild aria-label="Back">
          <Link to="/me">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold">Gaming Currency</h1>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => toast("Transaction history will appear here after payments are connected")}
          aria-label="History"
        >
          <History className="h-5 w-5 text-gold" />
        </Button>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <section className="royal-gradient rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-elevated)]">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
            <WalletCards className="h-4 w-4" /> Wallet balance
          </div>
          <p className="mt-2 flex items-center gap-2 text-3xl font-black">
            <Coins className="h-7 w-7 text-gold" /> {(profile?.coins ?? 0).toLocaleString()}
          </p>
          <p className="mt-2 text-xs opacity-80">
            Use coins for gifts, self-gifts, family creation and room effects.
          </p>
        </section>

        <section className="surface-card rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold">Buy coins securely</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Real-money checkout will be enabled after the payment gateway is connected.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          {PACKAGES.map((pack) => (
            <button
              key={pack.coins}
              type="button"
              onClick={() => toast("Payment gateway setup is required before checkout")}
              className="surface-card rounded-2xl p-4 text-left transition hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/30"
            >
              <p className="flex items-center gap-1.5 text-lg font-black">
                <Coins className="h-4 w-4 text-gold" />
                {pack.coins.toLocaleString()}
              </p>
              <p className="mt-1 text-sm font-bold text-primary">{pack.price}</p>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Check className="h-3 w-3 text-emerald-500" /> {pack.bonus}
              </p>
            </button>
          ))}
        </div>

        <Button variant="secondary" className="w-full" asChild>
          <Link to="/family">Open Family — create for 25,000 coins</Link>
        </Button>
      </main>
      <BottomNav />
    </div>
  );
}
