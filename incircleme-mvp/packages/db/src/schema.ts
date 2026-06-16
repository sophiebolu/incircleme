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
  numeric,
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
  // Host pricing tier (Pricing v2) — gates Program submission. Default basic; dev sets premium by hand.
  hostTier: text('host_tier').notNull().default('basic'), // 'basic' | 'pro' | 'premium'
  // Free Program credits (Premium includes 1). Consumed on submission before any fee.
  freeProgramCredits: integer('free_program_credits').notNull().default(0),
  // Internal role — 'trust_reviewer' may use the admin review queue. Dev sets by hand.
  role: text('role').notNull().default('member'), // 'member' | 'trust_reviewer'
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
  // UGC translation strategy (Brief Addendum A): original language, creator-set.
  language: text('language').notNull().default('ca'), // 'ca' | 'es' | 'en'
  // Optional creator-provided translations (UI surfaces in Slice 5).
  titleCa: text('title_ca'),
  titleEs: text('title_es'),
  titleEn: text('title_en'),
  descriptionCa: text('description_ca'),
  descriptionEs: text('description_es'),
  descriptionEn: text('description_en'),
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
  // Addendum A: original language of the message. NULL until detection lands (Phase 2)
  // — never silently auto-translated; display is always original-first.
  language: text('language'), // 'ca' | 'es' | 'en' | null
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

// Notification ledger (Brief MVP table). Push delivery is stubbed until Phase 2 —
// rows are the durable record the jobs write and the UI can read.
export const notifications = pgTable('notifications', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  type: text('type').notNull(), // arriving_pre | arriving_post | address_unlock | circle_msg | booking_confirm
  payload: jsonb('payload'),
  readAt: timestamp('read_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
});

export type NotificationRow = typeof notifications.$inferSelect;
export type CircleRow = typeof circles.$inferSelect;
export type CircleMemberRow = typeof circleMembers.$inferSelect;
export type CircleMessageRow = typeof circleMessages.$inferSelect;
export type ArrivingMomentRow = typeof arrivingMoments.$inferSelect;
export type CircleKeepVoteRow = typeof circleKeepVotes.$inferSelect;

// --- Memory Capsule slice ---

// Auto-generated 12h after event end (Brief cadence). Circle-only, permanent.
export const capsules = pgTable('capsules', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  circleId: uuid('circle_id')
    .notNull()
    .unique()
    .references(() => circles.id),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id),
  heroPhotoUrl: text('hero_photo_url'),
  // {members, sharedBoth, photos, messages, keptAt?} — snapshot at generation
  stats: jsonb('stats').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Items snapshot their payloads at generation (photo URLs survive the 48h chat strip).
// kind 'quote' stays empty until reviews land (Slice 6) — wired, not faked.
export const capsuleItems = pgTable('capsule_items', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  capsuleId: uuid('capsule_id')
    .notNull()
    .references(() => capsules.id),
  kind: text('kind').notNull(), // photo | arriving_pair | quote
  // photo: {url, userId} · arriving_pair: {userId, beforeUrl, afterUrl, beforeAt, afterAt}
  payload: jsonb('payload').notNull(),
  position: integer('position').notNull().default(0),
});

export type CapsuleRow = typeof capsules.$inferSelect;
export type CapsuleItemRow = typeof capsuleItems.$inferSelect;

// --- Programs + certificates slice (Premium credentialling) ---

// The verifiable unit behind every certificate. Premium-host only (gated in app).
export const programs = pgTable('programs', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  hostUserId: uuid('host_user_id')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  language: text('language').notNull().default('ca'), // Addendum A — original language
  curriculum: jsonb('curriculum'), // [{week, title, skills, hours}]
  timeFrameSessions: integer('time_frame_sessions'),
  timeFrameTotalHours: numeric('time_frame_total_hours'),
  assessmentMethod: text('assessment_method'),
  // Internal-Trust-only (kickoff decision): free-text label + the host's own id with that body.
  accreditationBody: text('accreditation_body'),
  accreditationId: text('accreditation_id'),
  references: jsonb('references'), // [{name, role, contact, verifiedAt}]
  status: text('status').notNull().default('draft'),
  // draft | submitted | pending_review | verified | under_review | rejected
  // No DB default: the fee is always written from @incircleme/config on insert
  // (programSubmissionFeeCents()), so config stays the single source of truth.
  submissionFeeCents: integer('submission_fee_cents').notNull(),
  stripePiId: text('stripe_pi_id'), // the €150 submission PI (null when a free credit was used)
  feeRefunded: boolean('fee_refunded').notNull().default(false),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: uuid('verified_by').references(() => users.id), // set ONLY on actual verification
  // Who made the latest review decision of any kind (verify/reject/under-review).
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  // Trust review (Part 2): tier assigned on verify + the accredited governing-body link.
  verifiedTier: text('verified_tier'), // 'verified' (gold) | 'accredited' (forest)
  governingBodyUrl: text('governing_body_url'), // required for the accredited tier
  reviewNotes: text('review_notes'), // internal reviewer notes
  // The 4-gate affirmations recorded at verify time (audit trail): { gateId: true }.
  gateChecks: jsonb('gate_checks'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Uploaded credential files (diploma, license, accreditation, reference letter).
export const programCredentials = pgTable('program_credentials', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id),
  fileUrl: text('file_url').notNull(),
  fileKind: text('file_kind').notNull(), // diploma | license | accreditation | reference_letter
  notes: text('notes'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Curated testimonials from past cohorts (read-only public; seeded for now). §39A.
export const programVoices = pgTable('program_voices', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id),
  quote: text('quote').notNull(),
  attribution: text('attribution').notNull(), // "Sofía R. · February cohort"
  cohortLabel: text('cohort_label'), // short note under the attribution
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Public Q&A on a Program. Part 2 ships READ-ONLY + seeded; the authenticated
// ask + host-answer write-path is a deferred fast-follow (table is ready). §39B.
export const programQuestions = pgTable('program_questions', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id),
  askerUserId: uuid('asker_user_id').references(() => users.id),
  askerName: text('asker_name').notNull(),
  question: text('question').notNull(),
  answer: text('answer'),
  answeredAt: timestamp('answered_at', { withTimezone: true }),
  isPublic: boolean('is_public').notNull().default(true),
  askedAt: timestamp('asked_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ProgramRow = typeof programs.$inferSelect;
export type NewProgramRow = typeof programs.$inferInsert;
export type ProgramCredentialRow = typeof programCredentials.$inferSelect;
export type ProgramVoiceRow = typeof programVoices.$inferSelect;
export type ProgramQuestionRow = typeof programQuestions.$inferSelect;
