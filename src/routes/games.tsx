import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  Crown,
  Flame,
  Gamepad2,
  Gift,
  Radio,
  Sparkles,
  Tag,
  Users,
  Users2,
  Zap,
} from "lucide-react";
import { PageShell } from "@/components/AppShell";
import { GlobalTopBar } from "@/components/GlobalTopBar";
import spyArt from "@/assets/games/spy.jpg";
import ludoArt from "@/assets/games/ludo.jpg";
import drawArt from "@/assets/games/draw.jpg";
import micArt from "@/assets/games/mic.jpg";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "WePlay — Games, Rooms & Rewards" },
      {
        name: "description",
        content: "Play social games, enter voice rooms and collect rewards with friends.",
      },
    ],
  }),
  component: GamesPage,
});

type Game = {
  name: string;
  subtitle: string;
  emoji: string;
  art?: string;
  tone: string;
  tag: string;
  players?: string;
  category?: string;
  href?: "/play/$slug";
  slug?: string;
};

const FEATURED: Game[] = [
  {
    name: "Who's the Spy",
    subtitle: "Read the room. Find the liar.",
    emoji: "🕵️",
    art: spyArt,
    tone: "from-[#2d69ff] to-[#6f4bff]",
    tag: "HOT",
    players: "12.4K playing",
    category: "Social",
    href: "/play/$slug",
    slug: "spy",
  },
  {
    name: "Ludo Party",
    subtitle: "Roll. Race. Rule the room.",
    emoji: "🎲",
    art: ludoArt,
    tone: "from-[#ff8b3d] to-[#ff3f72]",
    tag: "3D",
    players: "8.7K playing",
    category: "Classic",
    href: "/play/$slug",
    slug: "ludo",
  },
];
const QUICK = [
  { label: "Ranking", icon: Crown, to: "/ranking", tone: "quick-gold" },
  { label: "Tasks", icon: ClipboardCheck, to: "/tasks", tone: "quick-blue" },
  { label: "Friends", icon: Users2, to: "/discover", tone: "quick-pink" },
  { label: "Events", icon: Gift, to: "/discover", tone: "quick-purple" },
] as const;
const MORE: Game[] = [
  {
    name: "Guess My Drawing",
    subtitle: "Draw it. Let them guess.",
    emoji: "✏️",
    art: drawArt,
    tone: "from-[#ffb84d] to-[#ff6688]",
    tag: "SOCIAL",
    players: "4.2K playing",
    category: "Party",
  },
  {
    name: "Mic Grab",
    subtitle: "Own the spotlight.",
    emoji: "🎤",
    art: micArt,
    tone: "from-[#8b5cf6] to-[#d946ef]",
    tag: "VOICE",
    players: "2.9K playing",
    category: "Voice",
  },
  {
    name: "UNO",
    subtitle: "One card can change everything.",
    emoji: "🃏",
    tone: "from-[#21c4a8] to-[#2173ff]",
    tag: "NEW",
    players: "1.8K playing",
    category: "Cards",
  },
  {
    name: "Word Battle",
    subtitle: "Fast minds win more.",
    emoji: "✦",
    tone: "from-[#ffcb52] to-[#ff6b38]",
    tag: "TRENDING",
    players: "960 playing",
    category: "Party",
  },
];
const CATEGORIES = ["All", "Social", "Classic", "Party", "Voice", "Cards", "Couple"];
const NEW_GAMES: Game[] = [
  {
    name: "Paint to Hide",
    subtitle: "Hide your clue in plain sight.",
    emoji: "🎨",
    tone: "from-[#ef70a7] to-[#7257db]",
    tag: "NEW",
    players: "620 playing",
    category: "Social",
    href: "/play/$slug",
    slug: "paint-to-hide",
  },
  {
    name: "Oh My Card",
    subtitle: "Pick a card. Change the game.",
    emoji: "🃏",
    tone: "from-[#24b6b7] to-[#4265d6]",
    tag: "NEW",
    players: "410 playing",
    category: "Cards",
    href: "/play/$slug",
    slug: "oh-my-card",
  },
  {
    name: "Couple Games",
    subtitle: "Two players, one perfect match.",
    emoji: "💞",
    tone: "from-[#ff7893] to-[#f0a24c]",
    tag: "NEW",
    players: "280 playing",
    category: "Couple",
    href: "/play/$slug",
    slug: "couple-games",
  },
];
const LIVE_GAME_ROOMS = [
  {
    name: "Midnight Spy Squad",
    game: "Who's the Spy",
    players: "6/8 players",
    host: "NeonTiger",
    tone: "from-[#4158d0] to-[#c850c0]",
  },
  {
    name: "Ludo Legends • Fast",
    game: "Ludo Party",
    players: "3/4 players",
    host: "MayaLive",
    tone: "from-[#ff9966] to-[#ff5e62]",
  },
  {
    name: "Draw & Guess Hindi",
    game: "Guess My Drawing",
    players: "7/10 players",
    host: "RohanArt",
    tone: "from-[#00b09b] to-[#96c93d]",
  },
];

function GameCard({ game, featured = false }: { game: Game; featured?: boolean }) {
  const body = (
    <>
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      {game.art ? (
        <img
          src={game.art}
          alt=""
          className="absolute inset-0 h-full w-full object-cover mix-blend-screen opacity-90"
        />
      ) : (
        <span className="absolute right-4 top-5 text-6xl drop-shadow-2xl">{game.emoji}</span>
      )}
      <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2 py-1 text-[9px] font-black tracking-widest text-white backdrop-blur">
        {game.tag}
      </span>
      <span className="absolute bottom-3 left-4 right-3">
        <b className={`${featured ? "text-xl" : "text-sm"} block font-black text-white`}>
          {game.name}
        </b>
        <small className="mt-0.5 block text-[11px] text-white/75">{game.subtitle}</small>
        {game.players ? (
          <small className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-white/80">
            <Users className="h-3 w-3" />
            {game.players}
          </small>
        ) : null}
      </span>
      <span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur">
        <ArrowRight className="h-4 w-4" />
      </span>
    </>
  );
  const className = `relative block overflow-hidden rounded-[1.4rem] bg-gradient-to-br ${game.tone} shadow-[0_18px_45px_-18px_rgba(31,41,120,.75)] ring-1 ring-white/15 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-18px_rgba(31,41,120,.9)] active:scale-[.98] ${featured ? "h-48" : "h-36"}`;
  return game.href ? (
    <Link to={game.href} params={{ slug: game.slug ?? "" }} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" className={`w-full text-left ${className}`}>
      {body}
    </button>
  );
}

function GamesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const matchesCategory = (game: Game) =>
    activeCategory === "All" || game.category === activeCategory;
  const featuredGames = FEATURED.filter(matchesCategory);
  const popularGames = [...FEATURED, ...MORE.slice(0, 2)].filter(matchesCategory);
  const newGames = NEW_GAMES.filter(matchesCategory);
  const moreGames = MORE.filter(matchesCategory);
  return (
    <PageShell className="weplay-page pb-8">
      <GlobalTopBar />
      <main className="mx-auto max-w-2xl px-4 pb-8 pt-4 sm:px-6">
        <section className="weplay-welcome">
          <div>
            <p className="text-eyebrow text-primary">THE SOCIAL PLAYGROUND</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              What are we playing?
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump into a room, bring your friends and make some noise.
            </p>
          </div>
          <div className="weplay-level">
            <Zap className="h-4 w-4 text-gold" />
            <b>Lv. 12</b>
            <small>40/60 XP</small>
          </div>
        </section>
        <section className="event-banner mt-5">
          <span className="event-banner-icon">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <b className="block text-sm">Lucky Red Packet Rush</b>
            <span className="text-[11px] text-muted-foreground">
              10K gold is dropping in a live room now
            </span>
          </div>
          <Link
            to="/"
            className="ml-auto rounded-full bg-foreground px-3 py-1.5 text-[11px] font-bold text-background"
          >
            Enter
          </Link>
        </section>
        <section className="mt-6 grid grid-cols-4 gap-2">
          {QUICK.map((item) => (
            <Link key={item.label} to={item.to} className="quick-action">
              <span className={`quick-icon ${item.tone}`}>
                <item.icon className="h-5 w-5" />
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </section>
        <section className="mt-7 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`chip shrink-0 ${activeCategory === category ? "chip-active" : ""}`}
            >
              {category}
            </button>
          ))}
        </section>
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-eyebrow text-primary">FEATURED NOW</p>
              <h2 className="mt-1 text-xl font-black">Play with the crowd</h2>
            </div>
            <Link to="/discover" className="text-xs font-bold text-primary">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featuredGames.length > 0 ? (
              featuredGames.map((game) => <GameCard key={game.name} game={game} featured />)
            ) : (
              <p className="col-span-2 rounded-2xl bg-card p-5 text-sm text-muted-foreground">
                More featured games are coming soon.
              </p>
            )}
          </div>
        </section>
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-eyebrow text-primary">POPULAR GAMES</p>
              <h2 className="mt-1 text-xl font-black">Everyone is playing</h2>
            </div>
            <Link to="/discover" className="text-xs font-bold text-primary">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {popularGames.map((game) => (
              <GameCard key={`popular-${game.name}`} game={game} />
            ))}
          </div>
        </section>
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-gold" />
            <h2 className="text-xl font-black">New games</h2>
            <span className="ml-auto text-[11px] font-semibold text-muted-foreground">
              Fresh this week
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {newGames.map((game) => (
              <GameCard key={game.name} game={game} />
            ))}
          </div>
        </section>
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="text-xl font-black">More to explore</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {moreGames.map((game) => (
              <GameCard key={game.name} game={game} />
            ))}
          </div>
        </section>
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-eyebrow text-primary">GAME ROOMS</p>
              <h2 className="mt-1 text-xl font-black">Jump in now</h2>
            </div>
            <Link to="/" className="text-xs font-bold text-primary">
              All rooms
            </Link>
          </div>
          <div className="space-y-2.5">
            {LIVE_GAME_ROOMS.map((room) => (
              <Link
                key={room.name}
                to="/"
                className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-3 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${room.tone} text-xl`}
                >
                  <Gamepad2 className="h-5 w-5 text-white" />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{room.name}</b>
                  <small className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {room.game} · Host {room.host}
                  </small>
                  <small className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-primary">
                    <Users className="h-3 w-3" />
                    {room.players}
                  </small>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
              </Link>
            ))}
          </div>
        </section>
        <section className="mt-8 grid grid-cols-2 gap-3">
          <Link to="/discover" className="surface-card flex min-h-28 flex-col justify-between p-4">
            <span className="flex items-center gap-2 text-xs font-bold text-primary">
              <CalendarDays className="h-4 w-4" /> EVENTS
            </span>
            <span>
              <b className="block text-sm">Weekend Game Fest</b>
              <small className="text-[11px] text-muted-foreground">Earn double rewards</small>
            </span>
          </Link>
          <Link
            to="/wallet"
            className="surface-card flex min-h-28 flex-col justify-between bg-gradient-to-br from-gold/20 to-accent/10 p-4"
          >
            <span className="flex items-center gap-2 text-xs font-bold text-gold">
              <Gift className="h-4 w-4" /> GIFT PACK
            </span>
            <span>
              <b className="block text-sm">Claim in 02:48</b>
              <small className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock3 className="h-3 w-3" />
                Daily reward ready
              </small>
            </span>
          </Link>
        </section>
        <Link to="/" className="room-entry-card mt-6">
          <span className="room-entry-orb">
            <Radio className="h-6 w-6" />
          </span>
          <span className="flex-1">
            <b className="block text-sm">Voice Room</b>
            <small className="text-xs text-muted-foreground">Talk, gift and take the mic</small>
          </span>
          <ArrowRight className="h-5 w-5 text-primary" />
        </Link>
      </main>
    </PageShell>
  );
}
