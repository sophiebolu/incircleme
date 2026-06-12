import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  customType,
  unique,
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

// --- Auth slice ---

// Single-use, short-lived passwordless sign-in tokens. Only the hash is stored.
export const magicLinkTokens = pgTable('magic_link_tokens', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  email: citext('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Refresh-token-backed sessions. Rotated on refresh, revoked on logout. Only the hash is stored.
export const sessions = pgTable('sessions', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  refreshTokenHash: text('refresh_token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  userAgent: text('user_agent'),
  ip: text('ip'),
});

// Links a provider identity (google | apple) to a user.
export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    provider: text('provider').notNull(), // 'google' | 'apple'
    providerUserId: text('provider_user_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('oauth_accounts_provider_user_unique').on(t.provider, t.providerUserId)],
);

export type MagicLinkTokenRow = typeof magicLinkTokens.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type OAuthAccountRow = typeof oauthAccounts.$inferSelect;
