import type { TrustTier, FoundingStatus } from './index';
import type { EventListItem } from './events';
import type { ReviewAggregate } from './reviews';

/**
 * Derived founding-host badge surface.  Rendered on both the Passport and the
 * public profile whenever founding_status is set (active OR lapsed).
 * Perk-suspension is NEVER surfaced publicly — callers see only the badge.
 */
export interface FoundingHostBadge {
  /** Matches users.founding_status (active or lapsed). */
  status: FoundingStatus;
  /**
   * Human-readable cohort label from config at read time — NOT stored.
   * e.g. 'gracia' → 'Gràcia'.
   */
  cohortLabel: string;
  /** ISO-8601 timestamp when the badge was granted (users.founding_granted_at). */
  grantedAt: string;
}

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
  /**
   * Founding-host badge, present when founding_status is set (active or lapsed).
   * Absent (undefined) for non-founding hosts.
   */
  foundingHost?: FoundingHostBadge;
}
