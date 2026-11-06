import { NextResponse } from 'next/server'
import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vibelyEvents, vibelyGames, vibelyRooms } from '@/lib/db/schema'

export async function GET() {
  const [games, rooms, events] = await Promise.all([
    db.select().from(vibelyGames).orderBy(desc(vibelyGames.isFeatured), desc(vibelyGames.activePlayers), asc(vibelyGames.name)),
    db.select().from(vibelyRooms).where(eq(vibelyRooms.isLive, true)).orderBy(desc(vibelyRooms.memberCount)),
    db.select().from(vibelyEvents).orderBy(desc(vibelyEvents.startsAt)),
  ])

  return NextResponse.json({ games, rooms, events })
}
