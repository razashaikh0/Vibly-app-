import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGUAGES, useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/language")({
  head: () => ({
    meta: [
      { title: "Language Settings — English or Hindi" },
      {
        name: "description",
        content: "Switch the app language between English and Hindi for menus, navigation and labels.",
      },
      { property: "og:title", content: "Language Settings — English or Hindi" },
      {
        property: "og:description",
        content: "Pick English or Hindi as your app language in one tap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LanguagePage,
});

function LanguagePage() {
  const { lang, t, change } = useLanguage();

  return (
    <div className="min-h-screen pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]">
      <header className="glass sticky top-0 z-20 mx-auto flex max-w-lg items-center gap-2 px-3 py-3">
        <Button size="icon" variant="ghost" asChild aria-label="Back">
          <Link to="/me">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-bold">{t("lang.title")}</h1>
      </header>

      <main className="mx-auto max-w-lg px-5 py-4">
        <p className="text-sm text-muted-foreground">{t("lang.subtitle")}</p>
        <ul className="glass mt-4 divide-y divide-border/60 rounded-2xl">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => {
                  change(l.code);
                  toast.success(`${l.label} selected`);
                }}
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
              >
                <span className="flex-1 text-sm font-semibold">
                  {l.label}
                  <span className="ml-2 text-muted-foreground">{l.native}</span>
                </span>
                {lang === l.code ? <Check className="h-5 w-5 text-primary" /> : null}
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
