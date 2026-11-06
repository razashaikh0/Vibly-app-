import { Link, useRouterState } from "@tanstack/react-router";
import { Gamepad2, MessageCircle, Compass, User, Radio } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const TABS = [
  { to: "/games", label: "nav.home", icon: Gamepad2 },
  { to: "/", label: "nav.rooms", icon: Radio },
  { to: "/chats", label: "nav.chats", icon: MessageCircle },
  { to: "/discover", label: "nav.discover", icon: Compass },
  { to: "/me", label: "nav.me", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useLanguage();

  return (
    <nav
      aria-label="Primary navigation"
      className="app-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between gap-0.5 px-1 py-1 sm:px-2 sm:py-1.5">
        {TABS.map((tab) => {
          const active =
            tab.to === "/"
              ? pathname === "/"
              : pathname === tab.to || pathname.startsWith(`${tab.to}/`);
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="min-w-0 flex-1">
              <Link
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-0.5 py-1 text-[9px] font-semibold transition-colors sm:text-[10px] ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full transition-colors sm:h-8 sm:w-8 ${
                    active ? "bg-primary/12" : ""
                  }`}
                >
                  <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </span>
                <span className="w-full truncate text-center">{t(tab.label)}</span>
                <span
                  aria-hidden
                  className={`h-1 w-4 rounded-full ${active ? "bg-primary" : "bg-transparent"}`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
