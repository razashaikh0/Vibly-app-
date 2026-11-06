import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const vibelyProfiles = pgTable('vibely_profiles', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  handle: text('handle').notNull().unique(),
  avatarUrl: text('avatar_url'),
  country: text('country').default('Global'),
  level: integer('level').notNull().default(1),
  vipLevel: integer('vip_level').notNull().default(0),
  charmScore: integer('charm_score').notNull().default(0),
  wealthScore: integer('wealth_score').notNull().default(0),
  signature: text('signature'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vibelyGames = pgTable('vibely_games', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  accent: text('accent').notNull(),
  isFeatured: boolean('is_featured').notNull().default(false),
  isNew: boolean('is_new').notNull().default(false),
  activePlayers: integer('active_players').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vibelyRooms = pgTable('vibely_rooms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  hostProfileId: text('host_profile_id').notNull(),
  language: text('language').notNull().default('English'),
  memberCount: integer('member_count').notNull().default(0),
  capacity: integer('capacity').notNull().default(50),
  isLive: boolean('is_live').notNull().default(true),
  coverUrl: text('cover_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vibelyWallets = pgTable('vibely_wallets', {
  profileId: text('profile_id').primaryKey(),
  goldBalance: integer('gold_balance').notNull().default(0),
  diamondBalance: integer('diamond_balance').notNull().default(0),
  rewardBalance: integer('reward_balance').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vibelyEvents = pgTable('vibely_events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  category: text('category').notNull(),
  rewardLabel: text('reward_label'),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  accent: text('accent').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vibelyNotifications = pgTable('vibely_notifications', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').notNull(),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
