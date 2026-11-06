import { NextResponse } from 'next/server'
import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { matchplayEvents, matchplayGames, matchplayRooms } from '@/lib/db/schema'

export async function GET() {
  const [games, rooms, events] = await Promise.all([
    db.select().from(matchplayGames).orderBy(desc(matchplayGames.isFeatured), desc(matchplayGames.activePlayers), asc(matchplayGames.name)),
    db.select().from(matchplayRooms).where(eq(matchplayRooms.isLive, true)).orderBy(desc(matchplayRooms.memberCount)),
    db.select().from(matchplayEvents).orderBy(desc(matchplayEvents.startsAt)),
  ])

  return NextResponse.json({ games, rooms, events })
}
