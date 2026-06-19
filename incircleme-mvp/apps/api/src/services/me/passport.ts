import type { PassportSummary } from '@incircleme/types';
import { getUserById, toUser } from '../auth/users';
import { getUserStats } from './stats';
import { getHostAggregate, getMyReviewCounts } from '../reviews/reviews';
import { listMyCircles } from '../circles/circles';

// Read-only Passport aggregate — composes existing signals (no new storage):
// identity + stats (attended/hosted/bookings) + reviews-received aggregate +
// reviews-written count + active Circle count. Trait scores, tier-progress %,
// and badges are NOT computed yet (Tier 3) — the UI renders those as honest stubs.
export async function getPassport(userId: string): Promise<PassportSummary | null> {
  const row = await getUserById(userId);
  if (!row) return null;
  const user = toUser(row);
  const [stats, reviewsReceived, counts, circles] = await Promise.all([
    getUserStats(userId),
    getHostAggregate(userId),
    getMyReviewCounts(userId),
    listMyCircles(userId),
  ]);
  return {
    displayName: user.displayName,
    neighbourhood: user.neighbourhood,
    trustTier: user.trustTier,
    joinedAt: user.joinedAt,
    attended: stats.attended,
    hosted: stats.hosted,
    bookings: stats.bookings,
    reviewsReceived,
    reviewsGiven: counts.given,
    activeCircles: circles.length,
  };
}
