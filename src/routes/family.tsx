import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Crown, Plus, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { CharmBadge } from "@/components/SeatFrame";
import { initials } from "@/lib/rooms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Families — Clans, Ranks & Weekly Activeness" },
      {
        name: "description",
        content:
          "Browse, create and join families. Track family level, weekly activeness, member roles and leaderboards.",
      },
      { property: "og:title", content: "Families — Clans, Ranks & Weekly Activeness" },
      {
        property: "og:description",
        content: "Create a family, invite members, climb the weekly activeness leaderboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FamilyPage,
});

type FamilyRow = {
  id: string;
  name: string;
  badge: string | null;
  announcement: string | null;
  intro: string | null;
  avatar_url: string | null;
  level: number;
  activeness: number;
  member_limit: number;
  region: string | null;
  leader_id: string;
  family_members: {
    user_id: string;
    role: string;
    points: number;
    profiles?: { display_name: string; avatar_url: string | null; coins: number } | null;
  }[];
};

const FAMILY_CREATE_COST = 25000;

function FamilyPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [badge, setBadge] = useState("");
  const [intro, setIntro] = useState("");

  const coins = profile?.coins ?? 0;

  const { data: families = [], isLoading } = useQuery({
    queryKey: ["families"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("families")
        .select(
          "*, family_members(user_id, role, points, profiles:user_id(display_name, avatar_url, coins))",
        )
        .order("activeness", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as FamilyRow[];
    },
    refetchInterval: 20000,
  });

  const myFamily = families.find((f) => f.family_members.some((m) => m.user_id === user?.id));
  const list = families.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()));

  const createFamily = async () => {
    if (!user) return;
    if (coins < FAMILY_CREATE_COST) {
      toast.error(`You need ${FAMILY_CREATE_COST.toLocaleString()} coins to create a family.`);
      return;
    }
    if (name.trim().length < 3) {
      toast.error("Family name must be at least 3 characters.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("create_family", {
      _name: name.trim(),
      _badge: badge.trim() || null,
      _intro: intro.trim() || null,
    });
    if (error || !data) {
      setBusy(false);
      toast.error(error?.message ?? "Could not create family");
      return;
    }
    setBusy(false);
    setOpen(false);
    setName("");
    setBadge("");
    setIntro("");
    toast.success("Family created");
    void queryClient.invalidateQueries({ queryKey: ["families"] });
  };

  const join = async (family: FamilyRow) => {
    if (!user) return;
    if (myFamily) {
      toast.error("Leave your current family first.");
      return;
    }
    if (family.family_members.length >= family.member_limit) {
      toast.error("This family is full.");
      return;
    }
    const { error } = await supabase
      .from("family_members")
      .insert({ family_id: family.id, user_id: user.id, role: "member" });
    if (error) toast.error(error.message);
    else {
      toast.success(`Joined ${family.name}`);
      void queryClient.invalidateQueries({ queryKey: ["families"] });
    }
  };

  const leave = async () => {
    if (!user) return;
    const { error } = await supabase.from("family_members").delete().eq("user_id", user.id);
    if (error) toast.error(error.message);
    else {
      toast.success("You left the family");
      void queryClient.invalidateQueries({ queryKey: ["families"] });
    }
  };

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <header className="app-header px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Link to="/me" aria-label="Back" className="rounded-full p-1.5">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex-1 text-base font-bold">Family</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 rounded-full px-3 text-xs">
                <Plus className="mr-1 h-3.5 w-3.5" /> Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-base">Create a family</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Creating a family costs {FAMILY_CREATE_COST.toLocaleString()} coins. Your balance:{" "}
                  {coins.toLocaleString()} coins.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="fname" className="text-xs">
                    Family name
                  </Label>
                  <Input
                    id="fname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fbadge" className="text-xs">
                    Badge (short tag)
                  </Label>
                  <Input
                    id="fbadge"
                    maxLength={8}
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fintro" className="text-xs">
                    Introduction
                  </Label>
                  <Textarea
                    id="fintro"
                    rows={3}
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <Button className="w-full" disabled={busy} onClick={() => void createFamily()}>
                  Create family
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mx-auto mt-3 max-w-lg">
          <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search families"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        {myFamily ? (
          <div className="surface-card mb-4 rounded-2xl p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              My family
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              <Avatar className="h-10 w-10 rounded-xl">
                <AvatarImage src={myFamily.avatar_url ?? undefined} alt={myFamily.name} />
                <AvatarFallback className="rounded-xl text-xs">
                  {initials(myFamily.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{myFamily.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Lv.{myFamily.level} · {myFamily.family_members.length}/{myFamily.member_limit}{" "}
                  members · {myFamily.activeness.toLocaleString()} activeness
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 text-xs"
                onClick={() => void leave()}
              >
                Leave
              </Button>
            </div>

            {/* Weekly activeness ranking of family members */}
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Weekly member ranking
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {[...myFamily.family_members]
                .sort(
                  (a, b) =>
                    b.points - a.points || (b.profiles?.coins ?? 0) - (a.profiles?.coins ?? 0),
                )
                .slice(0, 10)
                .map((m, i) => (
                  <li key={m.user_id} className="flex items-center gap-2">
                    <span
                      className={`w-4 text-center text-[11px] font-black ${
                        i === 0 ? "text-gold" : i < 3 ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={m.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[9px]">
                        {initials(m.profiles?.display_name ?? "M")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-xs">
                      {m.profiles?.display_name ?? "Member"}
                    </span>
                    <CharmBadge charm={m.profiles?.coins ?? 0} />
                    <span className="text-[11px] font-semibold text-primary">
                      {m.points.toLocaleString()}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading families…</p>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No families yet — create the first one.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((f, i) => {
              const mine = f.family_members.some((m) => m.user_id === user?.id);
              return (
                <li key={f.id} className="surface-card flex items-center gap-2.5 rounded-2xl p-2.5">
                  <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <Avatar className="h-10 w-10 rounded-xl">
                    <AvatarImage src={f.avatar_url ?? undefined} alt={f.name} />
                    <AvatarFallback className="rounded-xl text-xs">
                      {initials(f.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                      {f.name}
                      {f.badge ? (
                        <span className="chip px-1.5 py-0 text-[10px] font-bold">{f.badge}</span>
                      ) : null}
                    </p>
                    <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Crown className="h-3 w-3" /> Lv.{f.level}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> {f.family_members.length}/{f.member_limit}
                      </span>
                      <span>{f.activeness.toLocaleString()} act.</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={mine ? "secondary" : "default"}
                    className="h-8 rounded-full px-3 text-xs"
                    disabled={mine}
                    onClick={() => void join(f)}
                  >
                    {mine ? "Joined" : "Join"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
