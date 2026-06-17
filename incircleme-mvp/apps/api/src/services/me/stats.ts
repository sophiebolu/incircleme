import { db, bookings, events } from '@incircleme/db';
import { and, count, eq, gte, isNull, lt } from 'drizzle-orm';
import type { MeStats } from '@incircleme/types';

/**
 * Profile stat counts (no overlap):
 *   attended = confirmed bookings for PAST events
 *   bookings = confirmed bookings for UPCOMING events
 *   hosted   = events the user hosts (non-deleted)
 */
export async function getUserStats(userId: string): Promise<MeStats> {
  const now = new Date();

  const confirmedFor = async (past: boolean): Promise<number> => {
    const [row] = await db
      .select({ n: count() })
      .from(bookings)
      .innerJoin(events, eq(events.id, bookings.eventId))
      .where(
        and(
          eq(bookings.userId, userId),
          eq(bookings.status, 'confirmed'),
          past ? lt(events.endsAt, now) : gte(events.endsAt, now),
        ),
      );
    return Number(row?.n ?? 0);
  };

  const [attended, upcoming, hostedRow] = await Promise.all([
    confirmedFor(true),
    confirmedFor(false),
    db
      .select({ n: count() })
      .from(events)
      .where(and(eq(events.hostUserId, userId), isNull(events.deletedAt))),
  ]);

  return { attended, bookings: upcoming, hosted: Number(hostedRow[0]?.n ?? 0) };
}
