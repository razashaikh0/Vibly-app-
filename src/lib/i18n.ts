import { useEffect, useState } from "react";

export type Lang = "en" | "hi";

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];

const KEY = "vibely:lang";
const EVENT = "vibely:lang-change";

const DICT: Record<Lang, Record<string, string>> = {
  en: {
    "nav.games": "Games",
    "nav.rooms": "Rooms",
    "nav.chats": "Chats",
    "nav.tasks": "Tasks",
    "nav.home": "Home",
    "nav.discover": "Discover",
    "nav.me": "Me",
    "lang.title": "Language",
    "lang.subtitle": "Choose the language used across the app.",
    "lang.saved": "Language updated",
  },
  hi: {
    "nav.games": "गेम्स",
    "nav.rooms": "रूम्स",
    "nav.chats": "चैट",
    "nav.tasks": "टास्क",
    "nav.home": "होम",
    "nav.discover": "डिस्कवर",
    "nav.me": "प्रोफ़ाइल",
    "lang.title": "भाषा",
    "lang.subtitle": "ऐप में इस्तेमाल होने वाली भाषा चुनें।",
    "lang.saved": "भाषा बदल दी गई",
  },
};

export function getLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(KEY);
  return stored === "hi" ? "hi" : "en";
}

export function setLang(lang: Lang) {
  window.localStorage.setItem(KEY, lang);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(getLang());
    const sync = () => setLangState(getLang());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const t = (key: string) => DICT[lang][key] ?? DICT.en[key] ?? key;

  return { lang, t, change: (next: Lang) => setLang(next) };
}
