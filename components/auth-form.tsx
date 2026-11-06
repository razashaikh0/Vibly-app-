'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const result = mode === 'sign-in'
      ? await signIn.email({ email, password })
      : await signUp.email({ name, email, password })
    if (result.error) setError('Unable to continue. Check your details and try again.')
    else { router.push('/'); router.refresh() }
    setPending(false)
  }

  return <form onSubmit={submit} className="grid gap-4">
    {mode === 'sign-up' && <label className="grid gap-2 text-sm font-bold">Name<input value={name} onChange={(event) => setName(event.target.value)} required className="rounded-xl border border-[#ebe5ed] px-4 py-3 outline-none focus:border-[#ff6e96]" /></label>}
    <label className="grid gap-2 text-sm font-bold">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="rounded-xl border border-[#ebe5ed] px-4 py-3 outline-none focus:border-[#ff6e96]" /></label>
    <label className="grid gap-2 text-sm font-bold">Password<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required className="rounded-xl border border-[#ebe5ed] px-4 py-3 outline-none focus:border-[#ff6e96]" /></label>
    {error && <p role="alert" className="text-sm font-bold text-[#df5379]">{error}</p>}
    <button disabled={pending} className="rounded-full bg-gradient-to-r from-[#ff5f88] to-[#9b5de5] px-5 py-3 font-black text-white disabled:opacity-60">{pending ? 'Please wait' : mode === 'sign-in' ? 'Sign in to Vibely' : 'Create Vibely account'}</button>
  </form>
}
