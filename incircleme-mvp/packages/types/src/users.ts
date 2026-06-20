import type { TrustTier } from './index';
import type { EventListItem } from './events';
import type { ReviewAggregate } from './reviews';

/**
 * Read-only PUBLIC profile (host/creator). Composed from existing user fields +
 * the reviews aggregate + their upcoming public events. No private fields. The
 * full Reputation Passport (with "how to level up") is a separate, self-only screen.
 */
export interface PublicProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  neighbourhood: string | null;
  /** Content-language preference (the only language field on the user model). */
  language: string;
  trustTier: TrustTier;
  /** Position in the canonical tier ladder, 1..5. */
  trustLevel: number;
  verified: boolean;
  joinedAt: string;
  eventsHosted: number;
  /** Avg rating + count (and tallies) about this host. */
  reviews: ReviewAggregate;
  /** Their upcoming public events (each taps through to event detail). */
  upcomingEvents: EventListItem[];
}
