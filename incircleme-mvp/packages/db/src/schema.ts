import { pgTable, uuid, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

// MVP table 1 of N — `users`. Soft-delete everywhere; timestamps are timestamptz.
// TODO (Auth slice): switch id to app-generated UUIDv7; make email case-insensitive
// (citext or a lower() unique index).
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  displayName: text('display_name'),
  handle: text('handle').unique(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  neighbourhood: text('neighbourhood'),
  verified: boolean('verified').notNull().default(false),
  language: text('language').notNull().default('ca'), // 'ca' | 'es' | 'en'
  trustTier: text('trust_tier').notNull().default('newcomer'),
  trustScore: integer('trust_score').notNull().default(0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
