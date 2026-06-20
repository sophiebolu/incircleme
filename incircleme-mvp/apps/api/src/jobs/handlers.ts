import {
  db,
  events,
  bookings,
  circles,
  circleMessages,
  circleKeepVotes,
  notifications,
  capsules,
} from '@incircleme/db';
import { and, eq, gte, isNotNull, isNull, lt, lte } from 'drizzle-orm';
import { generateCapsule } from '../services/capsules/capsules';
import {
  grantFoundingBadgeIfEligible,
  hostHadRealAttendee,
} from '../services/foundingHost/foundingHost';

// Pure, idempotent tick handlers — BullMQ schedules them; tests call them directly
// with a fixed `now`. Each returns how many rows it touched.

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const KEEP_THRESHOLD = 4;

async function notifyBookedAttendees(eventId: string, type: string, payload: object) {
  const rows = await db
    .select({ userId: bookings.userId })
    .from(bookings)
    .where(and(eq(bookings.eventId, eventId), eq(bookings.status, 'confirmed')));
  let sent = 0;
  for (const { userId } of rows) {
    // Idempotency: at most one notification per user+type+event.
    const prior = await db
      .select({ payload: notifications.payload })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.type, type)));
    const dup = prior.some((n) => (n.payload as { eventId?: string } | null)?.eventId === eventId);
    if (!dup) {
      await db.insert(notifications).values({ userId, type, payload: { eventId, ...payload } });
      sent++;
    }
  }
  return sent;
}

/** Hourly: events starting in 23–24h → unlock address + notify. */
export async function addressUnlockTick(now: Date): Promise<number> {
  const rows = await db
    .update(events)
    .set({ addressLocked: false })
    .where(
      and(
        eq(events.addressLocked, true),
        gte(events.startsAt, new Date(now.getTime() + 23 * HOUR)),
        lte(events.startsAt, new Date(now.getTime() + 24 * HOUR)),
      ),
    )
    .returning({ id: events.id });
  for (const { id } of rows) await notifyBookedAttendees(id, 'address_unlock', {});
  return rows.length;
}

/** Every 5 min: events starting in ~6h → Arriving pre-prompt. */
export async function arrivingPreTick(now: Date): Promise<number> {
  const rows = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(
        eq(events.arrivingEnabled, true),
        gte(events.startsAt, new Date(now.getTime() + 5 * HOUR + 55 * MIN)),
        lte(events.startsAt, new Date(now.getTime() + 6 * HOUR + 5 * MIN)),
      ),
    );
  let n = 0;
  for (const { id } of rows) n += await notifyBookedAttendees(id, 'arriving_pre', {});
  return n;
}

/** Every 5 min: events ending in ~30 min → Arriving post-prompt. */
export async function arrivingPostTick(now: Date): Promise<number> {
  const rows = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(
        eq(events.arrivingEnabled, true),
        gte(events.endsAt, new Date(now.getTime() + 25 * MIN)),
        lte(events.endsAt, new Date(now.getTime() + 35 * MIN)),
      ),
    );
  let n = 0;
  for (const { id } of rows) n += await notifyBookedAttendees(id, 'arriving_post', {});
  return n;
}

/** Hourly: strip chat photo attachments older than 48h once the event is past. */
export async function chatPhotoExpiryTick(now: Date): Promise<number> {
  const candidates = await db
    .select({ id: circleMessages.id, circleId: circleMessages.circleId })
    .from(circleMessages)
    .innerJoin(circles, eq(circleMessages.circleId, circles.id))
    .innerJoin(events, eq(circles.eventId, events.id))
    .where(
      and(
        isNotNull(circleMessages.attachments),
        isNull(circleMessages.deletedAt),
        lt(circleMessages.createdAt, new Date(now.getTime() - 48 * HOUR)),
        lt(events.endsAt, now),
      ),
    );
  for (const { id } of candidates) {
    await db.update(circleMessages).set({ attachments: null }).where(eq(circleMessages.id, id));
  }
  return candidates.length;
}

/** Daily: circles whose event ended ≥7 days ago, not kept — evaluate the vote tally. */
export async function afterlifeEvaluateTick(now: Date): Promise<number> {
  // Step 1: fetch candidates — circles not yet kept whose event ended ≥7 days ago.
  const rows = await db
    .select({ circleId: circles.id, eventId: circles.eventId })
    .from(circles)
    .innerJoin(events, eq(circles.eventId, events.id))
    .where(and(isNull(circles.keptAt), lt(events.endsAt, new Date(now.getTime() - 7 * DAY))));

  let flipped = 0;

  for (const { circleId, eventId } of rows) {
    const votes = await db
      .select()
      .from(circleKeepVotes)
      .where(eq(circleKeepVotes.circleId, circleId));

    if (votes.filter((v) => v.vote).length >= KEEP_THRESHOLD) {
      // Step 2: flip keptAt (idempotent guard: only if still null).
      await db
        .update(circles)
        .set({ keptAt: now })
        .where(and(eq(circles.id, circleId), isNull(circles.keptAt)));
      flipped++;

      // ── Founding-host grant evaluation ───────────────────────────────────
      // Decision 1: a Circle becoming Kept triggers the founding-host check.
      // We need the event's host to evaluate the predicate.
      const [ev] = await db
        .select({ hostUserId: events.hostUserId, endsAt: events.endsAt })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (
        ev &&
        ev.endsAt < now && // condition (2): event has ended
        (await hostHadRealAttendee(eventId, ev.hostUserId)) // condition (3): real attendee
      ) {
        const outcome = await grantFoundingBadgeIfEligible(ev.hostUserId, now);
        // Outcomes other than 'granted' are expected and silent:
        //   'already_has_badge' → idempotent, host already counted
        //   'cap_reached'       → cohort is full, closes silently (Decision 2)
        //   'no_cohort_match'   → neighbourhood not in any active cohort
        //   'insufficient_kept_rooms' → shouldn't happen here (we just Kept one),
        //                              but harmless if the gate raises.
        if (outcome !== 'granted' && outcome !== 'already_has_badge') {
          console.debug('[afterlifeEvaluateTick] founding grant skipped', {
            circleId,
            eventId,
            hostUserId: ev.hostUserId,
            outcome,
          });
        }
      }
    }
  }

  return flipped;
}

/** Hourly: events ended ≥12h ago with a Circle and no Capsule → generate + notify. */
export async function capsuleGenerationTick(now: Date): Promise<number> {
  const rows = await db
    .select({ eventId: circles.eventId })
    .from(circles)
    .innerJoin(events, eq(circles.eventId, events.id))
    .leftJoin(capsules, eq(capsules.circleId, circles.id))
    .where(and(lt(events.endsAt, new Date(now.getTime() - 12 * HOUR)), isNull(capsules.id)));
  let generated = 0;
  for (const { eventId } of rows) {
    const capsule = await generateCapsule(eventId);
    if (capsule) {
      generated++;
      await notifyBookedAttendees(eventId, 'capsule_ready', {});
    }
  }
  return generated;
}
