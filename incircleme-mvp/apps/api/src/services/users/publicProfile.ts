import { db, users, events } from '@incircleme/db';
import { and, asc, eq, gte, isNull } from 'drizzle-orm';
import type { PublicProfile, TrustTier } from '@incircleme/types';
import { toEventListItem } from '../events/events';
import { getHostAggregate } from '../reviews/reviews';

// Canonical tier ladder (low → high). Level = index + 1.
const TIERS: readonly TrustTier[] = ['newcomer', 'regular', 'trusted', 'pillar', 'legend'];

/**
 * Read-only public profile for any user (used as the host/creator profile).
 * Returns only public fields composed from existing data — no private columns.
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return null;

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
  };
}
