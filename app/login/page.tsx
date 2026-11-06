"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Headphones, LockKeyhole, Sparkles, UserRound } from "lucide-react"
import { useState } from "react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fb] text-slate-900">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-6">
        <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-24 size-80 rounded-full bg-violet-500/20 blur-3xl" />

        <header className="relative flex items-center justify-between">
          <Link href="/" aria-label="Back to home" className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50">
            <ArrowLeft aria-hidden="true" />
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 shadow-lg shadow-fuchsia-500/25">
              <Sparkles aria-hidden="true" />
            </span>
            Vibely
          </div>
          <Link href="/" className="text-sm font-medium text-slate-500 transition hover:text-slate-900">Skip</Link>
        </header>

        <section className="relative mt-14">
          <div className="mb-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-fuchsia-300">Welcome back</p>
            <h1 className="text-4xl font-black tracking-[-0.04em]">Your people are<br />waiting for you.</h1>
            <p className="mt-4 max-w-[310px] text-sm leading-6 text-slate-500">Join voice rooms, play quick games, and keep your closest connections close.</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); router.push("/") }}>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Email or username
              <span className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-fuchsia-400/70 focus-within:bg-slate-50">
                <UserRound className="text-slate-400" aria-hidden="true" />
                <input className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" placeholder="you@example.com" autoComplete="username" />
              </span>
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Password
              <span className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-fuchsia-400/70 focus-within:bg-slate-50">
                <LockKeyhole className="text-slate-400" aria-hidden="true" />
                <input className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" placeholder="Enter your password" type={showPassword ? "text" : "password"} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-400 transition hover:text-slate-900" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-500"><input type="checkbox" className="size-4 accent-fuchsia-500" /> Remember me</label>
              <button type="button" className="font-semibold text-fuchsia-300">Forgot password?</button>
            </div>

            <button type="submit" className="mt-3 flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-sm font-bold shadow-xl shadow-fuchsia-500/20 transition hover:brightness-110 active:scale-[0.99]">Log in to Vibely</button>
          </form>

          <div className="my-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400"><span className="h-px flex-1 bg-slate-50" />or continue with<span className="h-px flex-1 bg-slate-50" /></div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><span className="text-base font-black">G</span> Google</button>
            <button type="button" onClick={() => router.push("/")} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Headphones aria-hidden="true" /> Guest mode</button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">New to Vibely? <Link href="/login" className="font-bold text-fuchsia-300">Create an account</Link></p>
        </section>

        <p className="relative mt-auto pt-10 text-center text-[11px] leading-5 text-slate-400">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </main>
  )
}
