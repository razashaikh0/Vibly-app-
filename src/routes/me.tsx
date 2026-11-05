import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Gem,
  Store,
  Shirt,
  Home as HomeIcon,
  Images,
  Trophy,
  Eye,
  UserPlus,
  Star,
  PenSquare,
  Languages,
  Settings,
  Sparkles,
  BarChart3,
  Users,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/rooms";
import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Me — Your Profile, VIP Center & Shop" },
      {
        name: "description",
        content:
          "Manage your profile, level progress, VIP center, shop purchases, badges and account settings.",
      },
      { property: "og:title", content: "Me — Your Profile, VIP Center & Shop" },
      {
        property: "og:description",
        content: "Your level, coins, VIP center, shop and account settings in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MePage,
});

const SHORTCUTS = [
  { label: "VIP Center", icon: Gem, tint: "from-gold/45 to-accent/40", to: "/shop" as const },
  { label: "Shop", icon: Store, tint: "from-accent/40 to-primary/25", to: "/shop" as const },
  { label: "PLAY Show", icon: Shirt, tint: "from-chart-4/35 to-primary/25", to: "/games" as const },
  { label: "My Home", icon: HomeIcon, tint: "from-gold/40 to-accent/35", to: "/cp" as const },
];

function MePage() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const level = Math.max(1, Math.floor((profile?.coins ?? 0) / 1000));
  const progress = ((profile?.coins ?? 0) % 1000) / 10;

  const rows = [
    { label: "Tasks", icon: Trophy, to: "/tasks" as const },
    { label: "Moments", icon: Images, to: "/discover" as const },
    { label: "Stats", icon: Trophy, to: "/analytics" as const },
    { label: "Visitors", icon: Eye, to: "/discover" as const },
    { label: "Invite Friends", icon: UserPlus, to: "/discover" as const },
    { label: "Badge", icon: Star, to: "/ranking" as const },
    { label: "Contributions", icon: PenSquare, to: "/ranking" as const },
    { label: "Room Animations", icon: Sparkles, to: "/effects" as const },
    { label: "Family", icon: Users, to: "/family" as const },
    { label: "Charm & Active Levels", icon: Gem, to: "/levels" as const },
    { label: "Language", icon: Languages, to: "/language" as const },
    { label: "Settings", icon: Settings, to: "/account" as const },
    { label: "Analytics", icon: BarChart3, to: "/analytics" as const },
    { label: "Privacy Policy", icon: ShieldCheck, to: "/privacy" as const },
    { label: "Security", icon: ShieldCheck, to: "/security" as const },
  ];

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <div className="bg-gradient-to-b from-primary/15 to-transparent px-4 pb-6 pt-6">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Avatar className="h-20 w-20 rounded-2xl">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.display_name ?? "Profile"} />
            <AvatarFallback className="rounded-2xl text-xl">
              {initials(profile?.display_name ?? "Player")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">{profile?.display_name ?? "Guest"}</p>
            <p className="text-xs text-muted-foreground">🪙 {profile?.coins?.toLocaleString() ?? 0} coins</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs font-bold">Lv.{level}</span>
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-[11px] text-muted-foreground">{Math.round(progress)}%</span>
            </div>
          </div>
          {user ? (
            <Link to="/profile/$userId" params={{ userId: user.id }} aria-label="View profile">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ) : null}
        </div>

        <div className="mx-auto mt-6 grid max-w-lg grid-cols-4 gap-2 text-center text-xs font-medium">
          {SHORTCUTS.map((s) => (
            <Link key={s.label} to={s.to} className="flex flex-col items-center gap-1.5">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${s.tint}`}>
                <s.icon className="h-5 w-5 text-primary-foreground" />
              </span>
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <ul className="glass mx-auto max-w-lg divide-y divide-border/60 rounded-2xl">
        {rows.map((row) => (
          <li key={row.label}>
            <Link to={row.to} className="flex items-center gap-3 px-4 py-3.5">
              <row.icon className="h-5 w-5 text-primary" />
              <span className="flex-1 text-sm font-medium">{row.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      <BottomNav />
    </div>
  );
}
