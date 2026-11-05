import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function SplashScreen({ redirectTo = "/auth", delay = 1800 }: { redirectTo?: string; delay?: number }) {
  const navigate = useNavigate();

  useEffect(() => {
    const id = window.setTimeout(() => {
      void navigate({ to: redirectTo });
    }, delay);
    return () => window.clearTimeout(id);
  }, [navigate, redirectTo, delay]);

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[image:var(--gradient-brand)] px-6 text-center">
      <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="relative">
        <span className="absolute inset-0 -z-10 animate-ping rounded-[2rem] bg-white/25" />
        <img
          src={logo}
          alt="App logo"
          width={112}
          height={112}
          className="h-28 w-28 animate-scale-in rounded-[2rem] shadow-2xl ring-1 ring-white/30"
        />
      </div>
      <p className="mt-8 animate-fade-in font-display text-2xl font-extrabold tracking-tight text-white">
        Live Voice Rooms
      </p>
      <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/20">
        <span className="block h-full w-1/3 animate-[slide-in-right_1.2s_ease-in-out_infinite] rounded-full bg-white/80" />
      </div>
    </main>
  );
}
