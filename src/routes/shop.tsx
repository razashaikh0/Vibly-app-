import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Backpack, Coins, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { RingArt, DecorArt } from "@/components/RingArt";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Rings, Frames, Room Themes & Coins" },
      {
        name: "description",
        content:
          "Buy relationship rings, avatar frames, voice room backgrounds, red packets and coin bundles.",
      },
      { property: "og:title", content: "Shop — Rings, Frames, Room Themes & Coins" },
      {
        property: "og:description",
        content: "Spend your coins on rings, frames, room backgrounds and more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

type Item = {
  name: string;
  emoji: string;
  price: number | string;
  tint: string;
  badge?: string;
  /** animated artwork: a jewellery ring, or a themed medallion */
  art?: "ring" | "decor";
  artStyle?: string;
};
type Section = { title: string; items: Item[] };
type Category = { key: string; label: string; sections: Section[] };

const CATEGORIES: Category[] = [
  {
    key: "relationship",
    label: "Relationship",
    sections: [
      {
        title: "Rings",
        items: [
          { name: "Unicorn Ring", emoji: "🦄", price: 131466, tint: "bg-violet-100", art: "ring", artStyle: "unicorn" },
          { name: "Heart Ring", emoji: "💍", price: 41900, tint: "bg-pink-100", art: "ring", artStyle: "heart" },
          { name: "Crystal Ring", emoji: "💠", price: 30000, tint: "bg-sky-100", art: "ring", artStyle: "crystal" },
          { name: "Half Moon Ring", emoji: "💫", price: 11111, tint: "bg-blue-100", art: "ring", artStyle: "emerald" },
        ],
      },
      {
        title: "Token",
        items: [
          { name: "Paper Airplane", emoji: "✈️", price: 1500, tint: "bg-sky-100" },
          { name: "Friendship Bracelets", emoji: "📿", price: 2000, tint: "bg-amber-100" },
          { name: "Propeller Aircraft", emoji: "🛩️", price: 50000, tint: "bg-indigo-100" },
          { name: "Motorcycle", emoji: "🏍️", price: 15000, tint: "bg-emerald-100" },
          { name: "Castle", emoji: "🏰", price: 100000, tint: "bg-teal-100" },
          { name: "Magic Luxury Car", emoji: "🏎️", price: 150000, tint: "bg-purple-100" },
        ],
      },
    ],
  },
  {
    key: "decorations",
    label: "Decorations",
    sections: [
      {
        title: "Frames",
        items: [
          { name: "Brave of Love", emoji: "🕊️", price: "Activity", tint: "bg-violet-100", art: "decor", artStyle: "royal" },
          { name: "Knight of Love", emoji: "⚔️", price: "Activity", tint: "bg-indigo-100", art: "decor", artStyle: "crystal" },
          { name: "Dragon War", emoji: "🐉", price: "Activity", tint: "bg-sky-100", art: "decor", artStyle: "emerald" },
          { name: "Rainbow Unicorn", emoji: "🌈", price: 600, tint: "bg-cyan-100", art: "decor", artStyle: "unicorn" },
          { name: "Foxie", emoji: "🦊", price: 600, tint: "bg-green-100", art: "decor", artStyle: "heart" },
          { name: "Iced Bubble Tea", emoji: "🧋", price: 600, tint: "bg-blue-100", art: "decor", artStyle: "crystal" },
        ],
      },
      {
        title: "Mount",
        items: [
          { name: "Cloud Rider", emoji: "☁️", price: 3000, tint: "bg-sky-100", art: "decor", artStyle: "crystal" },
          { name: "Flame Tiger", emoji: "🐅", price: 8800, tint: "bg-orange-100", art: "decor", artStyle: "heart" },
          { name: "Star Whale", emoji: "🐋", price: 12000, tint: "bg-indigo-100", art: "decor", artStyle: "royal" },
        ],
      },
    ],
  },
  {
    key: "voice-room",
    label: "Voice Room",
    sections: [
      {
        title: "Room Background",
        items: [
          { name: "Emperor Castle", emoji: "🏛️", price: "Activity", tint: "bg-amber-100" },
          { name: "Golden Lion", emoji: "🦁", price: "Activity", tint: "bg-yellow-100" },
          { name: "Golden Brick", emoji: "🧱", price: "Activity", tint: "bg-orange-100" },
          { name: "Shining Stage", emoji: "✨", price: 750, tint: "bg-fuchsia-100" },
          { name: "Summer Breeze", emoji: "🌊", price: 750, tint: "bg-rose-100" },
          { name: "Milky Reunion", emoji: "🌌", price: 750, tint: "bg-blue-100" },
        ],
      },
      {
        title: "Entrance Effects",
        items: [
          { name: "Royal Carpet", emoji: "🟥", price: 1200, tint: "bg-red-100", art: "decor", artStyle: "heart" },
          { name: "Petal Storm", emoji: "🌸", price: 1200, tint: "bg-pink-100", art: "decor", artStyle: "unicorn" },
          { name: "Thunder Entry", emoji: "⚡", price: 1500, tint: "bg-violet-100", art: "decor", artStyle: "royal" },
        ],
      },
    ],
  },
  {
    key: "items",
    label: "Items",
    sections: [
      {
        title: "Functions",
        items: [
          { name: "Business Gift Box", emoji: "🎁", price: "Activity", tint: "bg-yellow-100" },
          { name: "Expert Service", emoji: "🧑‍💼", price: "Activity", tint: "bg-sky-100" },
          { name: "Visitor Logbook", emoji: "📒", price: 600, tint: "bg-amber-100" },
        ],
      },
      {
        title: "Red Packets",
        items: [
          { name: "600 Gold Packets", emoji: "🧧", price: "₹99", tint: "bg-red-100" },
          { name: "1800 Gold Packets", emoji: "🧧", price: "₹299", tint: "bg-red-100" },
          { name: "3000 Gold Packets", emoji: "🧧", price: "₹499", tint: "bg-red-100", badge: "Gift broadcast" },
        ],
      },
    ],
  },
  {
    key: "games",
    label: "Games",
    sections: [
      {
        title: "Drawing Boards",
        items: [
          { name: "Halloween Board", emoji: "🎃", price: 300, tint: "bg-orange-100" },
          { name: "Cherry Board", emoji: "🍒", price: 300, tint: "bg-pink-100" },
          { name: "Hi Kittie Board", emoji: "🐱", price: 300, tint: "bg-rose-100" },
          { name: "Watermelon Palette", emoji: "🍉", price: 300, tint: "bg-red-100" },
          { name: "Little Dango Board", emoji: "🍡", price: 300, tint: "bg-pink-100" },
          { name: "Travel Board", emoji: "🧳", price: 300, tint: "bg-amber-100" },
        ],
      },
      {
        title: "Mic Animations",
        items: [
          { name: "Neon Pulse", emoji: "🔊", price: 500, tint: "bg-violet-100", art: "decor", artStyle: "unicorn" },
          { name: "Heart Beat", emoji: "💗", price: 500, tint: "bg-pink-100", art: "decor", artStyle: "heart" },
          { name: "Fire Ring", emoji: "🔥", price: 500, tint: "bg-orange-100", art: "decor", artStyle: "heart" },
        ],
      },
    ],
  },
  {
    key: "family",
    label: "Family",
    sections: [
      {
        title: "Supplies",
        items: [{ name: "Normal Chest", emoji: "🧰", price: 5000, tint: "bg-sky-100", badge: "Chief/Deputy" }],
      },
      {
        title: "Gold",
        items: [
          { name: "120 Gold", emoji: "🪙", price: 200, tint: "bg-amber-100" },
          { name: "300 Gold", emoji: "🪙", price: 500, tint: "bg-amber-100" },
          { name: "600 Gold", emoji: "🪙", price: 1000, tint: "bg-amber-100" },
        ],
      },
    ],
  },
];

function ShopPage() {
  const { profile } = useAuth();
  const [active, setActive] = useState(CATEGORIES[0]!.key);
  const category = CATEGORIES.find((c) => c.key === active)!;

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <header className="glass sticky top-0 z-20 flex items-center gap-2 px-3 py-3">
        <Button size="icon" variant="ghost" asChild aria-label="Back">
          <Link to="/me">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold">Shop</h1>
        <Button size="icon" variant="ghost" aria-label="Inventory" onClick={() => toast("Your inventory is empty")}>
          <Backpack className="h-5 w-5 text-gold" />
        </Button>
      </header>

      <div className="mx-auto max-w-lg px-4">
        <div className="flex items-center justify-between py-3 text-sm">
          <span className="text-muted-foreground">Balance:</span>
          <span className="flex items-center gap-1 font-bold text-gold">
            <Coins className="h-4 w-4" /> {profile?.coins?.toLocaleString() ?? 0}
            <button
              type="button"
              onClick={() => toast("Top-up coming soon")}
              className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-gold/20"
              aria-label="Top up"
            >
              <Plus className="h-3 w-3" />
            </button>
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl royal-gradient px-4 py-6 text-primary-foreground">
          <p className="text-2xl font-black">3D Avatar</p>
          <p className="text-sm font-semibold opacity-90">Dollify your new self</p>
        </div>

        <div className="mt-4 flex gap-4 overflow-x-auto pb-2 text-sm font-bold">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setActive(c.key)}
              className={`whitespace-nowrap border-b-2 pb-1 transition-colors ${
                active === c.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {category.sections.map((section) => (
          <section key={section.title} className="mt-6">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <h2 className="text-sm font-bold">{section.title}</h2>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {section.items.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => toast.success(`${item.name} added to wishlist`)}
                  className="text-left"
                >
                  <span
                    className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl ${item.tint} text-4xl`}
                  >
                    {item.art === "ring" ? (
                      <RingArt styleKey={item.artStyle ?? "crystal"} size={64} />
                    ) : item.art === "decor" ? (
                      <DecorArt emoji={item.emoji} styleKey={item.artStyle ?? "royal"} size={62} />
                    ) : (
                      item.emoji
                    )}
                    {item.badge ? (
                      <span className="absolute left-1 top-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold">
                        {item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1.5 block text-xs font-medium leading-tight">{item.name}</span>
                  <span className="mt-0.5 block text-xs font-bold text-gold">
                    {typeof item.price === "number" ? `🪙 ${item.price.toLocaleString()}` : item.price}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
