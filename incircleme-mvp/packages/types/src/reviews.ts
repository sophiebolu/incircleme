// Reviews — per (booking, reviewer). Private to the host by default; `isPublic`
// is an explicit opt-in that surfaces the review on the event page. Canonical
// vibe-tag keys live in @incircleme/config (REVIEWS.vibeTags); stored as strings.

export interface Review {
  id: string;
  bookingId: string;
  eventId: string;
  hostId: string;
  reviewerId: string;
  rating: number;
  /** Explicit yes/no the reviewer tapped; null if unanswered. Not derived from rating. */
  wouldGoAgain: boolean | null;
  vibeTags: string[];
  comment: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  /** Explicit yes/no ("Would you go again?"). */
  wouldGoAgain?: boolean;
  vibeTags?: string[];
  comment?: string;
  /** Opt-in to show on the event page; defaults false (host-only). */
  isPublic?: boolean;
}

/** Reviewer's PUBLIC identity (display name + avatar — never legal name). */
export interface PublicReviewAuthor {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

/** A single public (isPublic) review for the event page (GET /events/:id/reviews/public). */
export interface PublicReview {
  id: string;
  author: PublicReviewAuthor;
  rating: number;
  wouldGoAgain: boolean | null;
  vibeTags: string[];
  /** UGC — rendered as-written, never auto-translated. */
  comment: string | null;
  createdAt: string;
}

/** Aggregate the Passport + host + event page read. */
export interface ReviewAggregate {
  count: number;
  /** Mean rating, rounded to 1 decimal; 0 when count = 0. */
  avgRating: number;
  /** Reviews with rating >= config wouldGoAgainMinRating. */
  wouldGoAgainCount: number;
  /** Reviews carrying the `felt_included` vibe tag. */
  feltIncludedCount: number;
  /** Count per vibe-tag key. */
  tagCounts: Record<string, number>;
}

/** A reviewer's own running count (for the Passport "reviews received/given"). */
export interface MyReviewSummary {
  given: number;
  received: number;
}

/** Read-only Reputation Passport aggregate, composed from existing signals. */
export interface PassportSummary {
  displayName: string | null;
  neighbourhood: string | null;
  trustTier: import('./index').TrustTier;
  joinedAt: string;
  attended: number;
  hosted: number;
  bookings: number;
  /** Reviews received as a host (avg, tallies). */
  reviewsReceived: ReviewAggregate;
  /** Reviews this user has written for others. */
  reviewsGiven: number;
  activeCircles: number;
  /**
   * Founding-host badge, present when founding_status is set (active or lapsed).
   * Absent (undefined) for non-founding hosts.
   */
  foundingHost?: import('./users').FoundingHostBadge;
}
