import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'

export default function SignInPage() {
  return <main className="grid min-h-screen place-items-center bg-[#faf7fb] p-5"><section className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl shadow-[#e8ddea]"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff668c]">Welcome back</p><h1 className="mt-2 text-3xl font-black text-[#29243b]">Sign in to Vibely</h1><p className="mt-2 text-sm text-[#898091]">Join rooms, play games and meet your people.</p><div className="mt-6"><AuthForm mode="sign-in" /></div><p className="mt-5 text-center text-sm text-[#898091]">New to Vibely <Link className="font-black text-[#ec638d]" href="/sign-up">Create an account</Link></p></section></main>
}
