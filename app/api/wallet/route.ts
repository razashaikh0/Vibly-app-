import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { vibelyWalletTransactions } from '@/lib/db/schema'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const transactions = await db.select().from(vibelyWalletTransactions).where(eq(vibelyWalletTransactions.profileId, session.user.id)).orderBy(desc(vibelyWalletTransactions.createdAt)).limit(50)
  return NextResponse.json({ transactions })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await request.json().catch(() => null) as { currency?: string; amount?: number; kind?: string; reference?: string } | null
  const allowedCurrencies = ['gold', 'diamond', 'reward']
  if (!payload || !payload.currency || !allowedCurrencies.includes(payload.currency) || !Number.isInteger(payload.amount) || !payload.amount || Math.abs(payload.amount) > 1_000_000 || !payload.kind) return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 })
  const transaction = await db.insert(vibelyWalletTransactions).values({ id: randomUUID(), profileId: session.user.id, currency: payload.currency, amount: payload.amount, kind: payload.kind.slice(0, 40), reference: payload.reference?.slice(0, 120) }).returning()
  return NextResponse.json({ transaction: transaction[0] }, { status: 201 })
}
