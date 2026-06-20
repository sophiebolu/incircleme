// Shared domain types — derived from the Codex-Brief Pass-40 data model.
// Grows per slice. People-discovery types are intentionally absent (Pass 40 cut).

export * from './auth';
export * from './events';
export * from './capsules';
export * from './circles';
export * from './programs';
export * from './reviews';
export * from './users';

export type Locale = 'ca' | 'es' | 'en';

export type TrustTier = 'newcomer' | 'regular' | 'trusted' | 'pillar' | 'legend';

export type HostTier = 'basic' | 'pro' | 'premium';

/** Internal role — 'trust_reviewer' may use the admin review queue. */
export type UserRole = 'member' | 'trust_reviewer';

export type EventCategory =
  | 'food_drink'
  | 'wellness'
  | 'art_craft'
  | 'music'
  | 'nature'
  | 'learning';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
  neighbourhood: string | null;
  language: Locale;
  verified: boolean;
  trustTier: TrustTier;
  trustScore: number;
  hostTier: HostTier;
  freeProgramCredits: number;
  role: UserRole;
  joinedAt: string;
  lastSeenAt: string | null;
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
