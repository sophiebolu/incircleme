// Shared domain types — derived from the Codex-Brief Pass-40 data model.
// Grows per slice. People-discovery types are intentionally absent (Pass 40 cut).

export * from './auth';
export * from './events';

export type Locale = 'ca' | 'es' | 'en';

export type TrustTier = 'newcomer' | 'regular' | 'trusted' | 'pillar' | 'legend';

export type HostTier = 'basic' | 'pro' | 'premium';

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
  joinedAt: string;
  lastSeenAt: string | null;
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
