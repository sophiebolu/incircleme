import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  customType,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

// Case-insensitive text. Requires the `citext` extension (created in migration 0001).
const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

// MVP table 1 of N — `users`. Soft-delete everywhere; timestamps are timestamptz.
// id: sortable UUIDv7, generated app-side (Postgres 16 has no native uuidv7()).
// email: citext, so the unique constraint is case-insensitive.
export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  email: citext('email').notNull().unique(),
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
