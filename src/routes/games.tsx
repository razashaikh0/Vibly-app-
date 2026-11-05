import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, ClipboardCheck, Users2, DoorOpen } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import spyArt from "@/assets/games/spy.jpg";
import ludoArt from "@/assets/games/ludo.jpg";
import drawArt from "@/assets/games/draw.jpg";
import micArt from "@/assets/games/mic.jpg";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "Party Games — Play With Your Voice Room" },
      {
        name: "description",
        content:
          "Play party games with friends in voice rooms: Ludo, Who's the Spy, Guess My Drawing, Mic Grab and UNO.",
      },
      { property: "og:title", content: "Party Games — Play With Your Voice Room" },
      {
        property: "og:description",
        content: "Party games you play together in live voice rooms.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamesPage,
});

type Game = {
  name: string;
  emoji: string;
  gradient: string;
  art?: string;
  slug?: string;
  tag?: string;
  wide?: boolean;
};

const GAMES: Game[] = [
  { name: "Ludo", emoji: "🎲", gradient: "royal-gradient", art: ludoArt, tag: "3D", wide: true },
  { name: "Who's the Spy", emoji: "🕵️", gradient: "sky-gradient", art: spyArt, tag: "In room" },
  { name: "Guess My Drawing", emoji: "✏️", gradient: "mint-gradient", art: drawArt },
  { name: "Mic Grab", emoji: "🎤", gradient: "ember-gradient", art: micArt },
  { name: "UNO", emoji: "🃏", gradient: "gold-gradient", tag: "New" },
];

function CardBody({ game }: { game: Game }) {
  return (
    <>
      {game.art ? (
        <img
          src={game.art}
          alt=""
          loading="lazy"
          width={992}
          height={672}
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
      ) : null}
      <span className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />
      {game.tag ? (
        <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-foreground">
          {game.tag}
        </span>
      ) : null}
      <span
        className={`absolute bottom-2 left-3 max-w-[70%] text-base font-extrabold leading-tight drop-shadow ${
          game.art ? "text-foreground" : "text-primary-foreground"
        }`}
      >
        {game.name}
      </span>
      {game.art ? null : (
        <span className="absolute -bottom-2 right-2 text-5xl drop-shadow-lg">{game.emoji}</span>
      )}
    </>
  );
}

function GameCard({ game }: { game: Game }) {
  const className = `relative block overflow-hidden rounded-2xl ${game.gradient} p-4 text-left shadow-[var(--shadow-card)] ring-1 ring-primary-foreground/20 transition-transform active:scale-[0.98] ${
    game.wide ? "col-span-2 h-28" : "h-24"
  }`;

  if (game.slug) {
    return (
      <Link to="/play/$slug" params={{ slug: game.slug }} className={className}>
        <CardBody game={game} />
      </Link>
    );
  }
  return (
    <button type="button" className={className}>
      <CardBody game={game} />
    </button>
  );
}



function GamesPage() {
  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="flex items-center gap-2 overflow-hidden rounded-2xl ember-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          🧧 Lucky red packet dropping now!
          <span className="ml-auto rounded-full bg-background/90 px-3 py-0.5 text-xs text-foreground">
            Enter
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-medium">
          <Link to="/ranking" className="flex flex-col items-center gap-1.5">
            <span className="grid h-14 w-14 place-items-center rounded-2xl gold-gradient text-2xl shadow">
              <Crown className="h-6 w-6 text-primary-foreground" />
            </span>
            Ranking
          </Link>
          <Link to="/tasks" className="flex flex-col items-center gap-1.5">
            <span className="grid h-14 w-14 place-items-center rounded-2xl sky-gradient shadow">
              <ClipboardCheck className="h-6 w-6 text-primary-foreground" />
            </span>
            Tasks
          </Link>
          <Link to="/discover" className="flex flex-col items-center gap-1.5">
            <span className="grid h-14 w-14 place-items-center rounded-2xl mint-gradient shadow">
              <Users2 className="h-6 w-6 text-primary-foreground" />
            </span>
            Friends
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">Games</h1>
          <Link to="/">
            <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
              <DoorOpen className="h-3.5 w-3.5" /> Game Room
            </Badge>
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {GAMES.map((game) => (
            <GameCard key={game.name} game={game} />
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
