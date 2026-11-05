import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { DiceDuel } from "@/components/three/DiceDuel";
import { LuckyWheel } from "@/components/three/LuckyWheel";
import { SpinBottle } from "@/components/three/SpinBottle";

export const Route = createFileRoute("/play/$slug")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "3D Party Games — Play Live" },
      {
        name: "description",
        content: "Roll 3D dice, spin the lucky wheel and spin the bottle with your voice room.",
      },
      { property: "og:title", content: "3D Party Games — Play Live" },
      {
        property: "og:description",
        content: "Real 3D mini games you play with friends in voice rooms.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayPage,
});

const TITLES: Record<string, string> = {
  dice: "Dice Duel",
  wheel: "Lucky Wheel",
  bottle: "Spin the Bottle",
};

function PlayPage() {
  const { slug } = useParams({ from: "/play/$slug" });
  const title = TITLES[slug] ?? "Game";

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="flex items-center gap-2">
          <Link to="/games" className="rounded-full bg-secondary p-2">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-black tracking-tight">{title}</h1>
        </div>

        <div className="mt-4">
          {slug === "dice" ? (
            <DiceDuel />
          ) : slug === "wheel" ? (
            <LuckyWheel />
          ) : slug === "bottle" ? (
            <SpinBottle players={["You", "Aarav", "Meera", "Zoya", "Kabir", "Ishan"]} />
          ) : (
            <p className="text-sm text-muted-foreground">This game is coming soon.</p>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
