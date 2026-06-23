import type { PassportSummary } from '@incircleme/types';
import type { FoundingHostBadge } from '@incircleme/types';
import { getUserById, toUser } from '../auth/users';
import { getUserStats } from './stats';
import { getHostAggregate, getMyReviewCounts } from '../reviews/reviews';
import { listMyCircles } from '../circles/circles';
import { foundingCohortLabel, type FoundingCohortKey } from '@incircleme/config';
import { getCohortStats } from '../foundingHost/foundingHost';

// Read-only Passport aggregate — composes existing signals (no new storage):
// identity + stats (attended/hosted/bookings) + reviews-received aggregate +
// reviews-written count + active Circle count. Trait scores, tier-progress %,
// and badges are NOT computed yet (Tier 3) — the UI renders those as honest stubs.
//
// foundingHost is derived from users.founding_status / founding_cohort /
// founding_granted_at at read time — the cohort label comes from config, not storage.
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

  // Derive founding badge — present when founding_status is set (active or lapsed).
  // Cohort label is resolved from config at read time so it's always current.
  let foundingHost: FoundingHostBadge | undefined;
  if (row.foundingStatus && row.foundingCohort && row.foundingGrantedAt) {
    const stats = await getCohortStats(row.foundingCohort as FoundingCohortKey);
    foundingHost = {
      status: row.foundingStatus as FoundingHostBadge['status'],
      cohortLabel: foundingCohortLabel(row.foundingCohort as FoundingCohortKey),
      grantedAt: row.foundingGrantedAt.toISOString(),
      filled: stats.filled,
      cap: stats.cap,
      slotsRemaining: stats.slotsRemaining,
    };
  }

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
    foundingHost,
  };
}
