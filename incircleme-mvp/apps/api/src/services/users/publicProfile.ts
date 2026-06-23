import { db, users, events } from '@incircleme/db';
import { and, asc, eq, gte, isNull } from 'drizzle-orm';
import type { PublicProfile, TrustTier } from '@incircleme/types';
import type { FoundingHostBadge } from '@incircleme/types';
import { toEventListItem } from '../events/events';
import { getHostAggregate } from '../reviews/reviews';
import { foundingCohortLabel, type FoundingCohortKey } from '@incircleme/config';
import { getCohortStats } from '../foundingHost/foundingHost';

// Canonical tier ladder (low → high). Level = index + 1.
const TIERS: readonly TrustTier[] = ['newcomer', 'regular', 'trusted', 'pillar', 'legend'];

/**
 * Read-only public profile for any user (used as the host/creator profile).
 * Returns only public fields composed from existing data — no private columns.
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return null;
  if (u.deactivatedAt) return null; // deactivated accounts are hidden from public view

  const tier: TrustTier = (TIERS as readonly string[]).includes(u.trustTier)
    ? (u.trustTier as TrustTier)
    : 'newcomer';

  const [hosted, upcoming, reviews] = await Promise.all([
    db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.hostUserId, userId), isNull(events.deletedAt))),
    db
      .select()
      .from(events)
      .where(
        and(
          eq(events.hostUserId, userId),
          isNull(events.deletedAt),
          gte(events.startsAt, new Date()),
        ),
      )
      .orderBy(asc(events.startsAt)),
    getHostAggregate(userId),
  ]);

  // Derive founding badge — present when founding_status is set (active or lapsed).
  // Cohort label is resolved from config at read time so it's always current.
  // Perk-suspension is never exposed here — callers see the badge only.
  let foundingHost: FoundingHostBadge | undefined;
  if (u.foundingStatus && u.foundingCohort && u.foundingGrantedAt) {
    const stats = await getCohortStats(u.foundingCohort as FoundingCohortKey);
    foundingHost = {
      status: u.foundingStatus as FoundingHostBadge['status'],
      cohortLabel: foundingCohortLabel(u.foundingCohort as FoundingCohortKey),
      grantedAt: u.foundingGrantedAt.toISOString(),
      filled: stats.filled,
      cap: stats.cap,
      slotsRemaining: stats.slotsRemaining,
    };
  }

  return {
    id: u.id,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    neighbourhood: u.neighbourhood,
    language: u.language,
    trustTier: tier,
    trustLevel: TIERS.indexOf(tier) + 1,
    verified: u.verified,
    joinedAt: u.joinedAt.toISOString(),
    eventsHosted: hosted.length,
    reviews,
    upcomingEvents: upcoming.map(toEventListItem),
    foundingHost,
  };
}
