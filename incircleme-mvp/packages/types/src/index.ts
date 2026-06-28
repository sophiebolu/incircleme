// Shared domain types — derived from the Codex-Brief Pass-40 data model.
// Grows per slice. People-discovery types are intentionally absent (Pass 40 cut).

export * from './auth';
export * from './bookings';
export * from './events';
export * from './capsules';
export * from './circles';
export * from './programs';
export * from './reviews';
export * from './users';

export type Locale = 'ca' | 'es' | 'en';

export type TrustTier = 'newcomer' | 'regular' | 'trusted' | 'pillar' | 'legend';

export type HostTier = 'basic' | 'pro' | 'premium';

/**
 * Founding-host lifecycle status stored on users.founding_status.
 * null/absent  → not a founding host.
 * 'founding_active' → granted and currently in good standing.
 * 'founding_lapsed' → was granted; upkeep bar not met (Facet B, deferred).
 * Schema supports both so lapse drops in with no migration rework.
 */
export type FoundingStatus = 'founding_active' | 'founding_lapsed';

/** Cohort keys mirroring ECONOMICS.foundingHost.cohorts keys in @incircleme/config. */
export type FoundingCohortKey = 'gracia';

/** Internal role — 'trust_reviewer' may use the admin review queue. */
export type UserRole = 'member' | 'trust_reviewer';

export type EventCategory =
  | 'food_drink'
  | 'wellness'
  | 'art_craft'
  | 'music'
  | 'nature'
  | 'learning';

/** Per-channel push/notification consent. `bookings` is always-on (locked true). */
export interface NotificationPrefs {
  bookings: boolean;
  circles: boolean;
  nearby: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
  neighbourhood: string | null;
  /** Onboarding picks. `intents` = mood-tiles + "I'm here to…" goals; `interests` == EventCategory keys. */
  intents: string[];
  interests: string[];
  notificationPrefs: NotificationPrefs;
  onboardingCompleted: boolean;
  language: Locale;
  verified: boolean;
  trustTier: TrustTier;
  trustScore: number;
  hostTier: HostTier;
  freeProgramCredits: number;
  role: UserRole;
  joinedAt: string;
  lastSeenAt: string | null;
  /** Reversible self-deactivation — ISO timestamp when deactivated, else null (active). */
  deactivatedAt: string | null;
}

/** Profile stat counts (GET /me/stats). No overlap between attended and bookings. */
export interface MeStats {
  attended: number; // confirmed bookings for past events
  bookings: number; // confirmed bookings for upcoming events
  hosted: number; // events the user hosts (non-deleted)
}

export interface EventSummary {
  id: string;
  title: string;
  category: EventCategory;
  neighbourhood: string | null;
  startsAt: string;
  endsAt: string;
  seatCount: number;
  seatsBooked: number;
  priceCents: number;
  currency: string;
  photoUrls: string[];
}
