import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  customType,
  unique,
  primaryKey,
  jsonb,
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

// --- Browse + Book slice ---

// Single events ("small rooms"). `address` stays hidden until address_locked=false (T-1 day).
export const events = pgTable('events', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  hostUserId: uuid('host_user_id')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(), // food_drink | wellness | art_craft | music | nature | learning
  neighbourhood: text('neighbourhood'),
  address: text('address'),
  addressLocked: boolean('address_locked').notNull().default(true),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes'),
  seatCount: integer('seat_count').notNull(),
  seatsHeld: integer('seats_held').notNull().default(0),
  seatsBooked: integer('seats_booked').notNull().default(0),
  priceCents: integer('price_cents').notNull().default(0),
  currency: text('currency').notNull().default('EUR'),
  photoUrls: text('photo_urls').array().notNull().default([]),
  arrivingEnabled: boolean('arriving_enabled').notNull().default(true),
  depositRequired: boolean('deposit_required').notNull().default(false),
  boostUntil: timestamp('boost_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const bookings = pgTable('bookings', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  status: text('status').notNull().default('held'), // held | confirmed | cancelled | refunded
  seatCount: integer('seat_count').notNull().default(1),
  amountCents: integer('amount_cents').notNull(),
  depositCents: integer('deposit_cents').notNull().default(0),
  stripePiId: text('stripe_pi_id'),
  heldUntil: timestamp('held_until', { withTimezone: true }),
  bookedAt: timestamp('booked_at', { withTimezone: true }).notNull().defaultNow(),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
});

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
export type BookingRow = typeof bookings.$inferSelect;
export type NewBookingRow = typeof bookings.$inferInsert;

// --- Circle chat slice ---

// One Circle per event, auto-created on the first confirmed booking.
export const circles = pgTable('circles', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  eventId: uuid('event_id')
    .notNull()
    .unique()
    .references(() => events.id),
  opensAt: timestamp('opens_at', { withTimezone: true }).notNull(), // 48h before event
  closesAt: timestamp('closes_at', { withTimezone: true }).notNull(), // 48h after, unless kept
  keptAt: timestamp('kept_at', { withTimezone: true }), // set when afterlife vote passes
  memberCount: integer('member_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const circleMembers = pgTable(
  'circle_members',
  {
    circleId: uuid('circle_id')
      .notNull()
      .references(() => circles.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: text('role').notNull().default('attendee'), // host | attendee
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp('left_at', { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.circleId, t.userId] })],
);

export const circleMessages = pgTable('circle_messages', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  circleId: uuid('circle_id')
    .notNull()
    .references(() => circles.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  attachments: jsonb('attachments'), // {type:'photo'|'arriving'|'leaving', url, expiresAt}
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Arriving feature — before/after mood photos. Chat-side copy expires at T+48h.
export const arrivingMoments = pgTable(
  'arriving_moments',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    state: text('state').notNull(), // 'before' | 'after'
    photoUrl: text('photo_url').notNull(),
    chatExpiresAt: timestamp('chat_expires_at', { withTimezone: true }).notNull(),
    takenAt: timestamp('taken_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [unique('arriving_event_user_state_unique').on(t.eventId, t.userId, t.state)],
);

// Afterlife vote ledger (approved Brief addendum 2026-06-12) — threshold 4 yes → kept.
export const circleKeepVotes = pgTable(
  'circle_keep_votes',
  {
    circleId: uuid('circle_id')
      .notNull()
      .references(() => circles.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    vote: boolean('vote').notNull(),
    votedAt: timestamp('voted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.circleId, t.userId] })],
);

export type CircleRow = typeof circles.$inferSelect;
export type CircleMemberRow = typeof circleMembers.$inferSelect;
export type CircleMessageRow = typeof circleMessages.$inferSelect;
export type ArrivingMomentRow = typeof arrivingMoments.$inferSelect;
export type CircleKeepVoteRow = typeof circleKeepVotes.$inferSelect;
