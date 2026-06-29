import { db, bookings, circles, events, users } from '@incircleme/db';
import type { BookingRow, EventRow } from '@incircleme/db';
import { and, asc, count, desc, eq, inArray, isNotNull, isNull, lt } from 'drizzle-orm';
import type {
  BookingListItem,
  BookingStatus,
  BookResult,
  EventAttendee,
  HostedEventSummary,
} from '@incircleme/types';
import type { Payments } from '../../lib/payments';
import { toEventListItem } from '../events/events';
import { trackEvent } from '../../lib/analytics';
import { bookingHoldWindowMs } from '@incircleme/config';

export class RoomFullError extends Error {
  constructor() {
    super('room_full');
  }
}
export class EventNotFoundError extends Error {
  constructor() {
    super('event_not_found');
  }
}
export class BookingNotFoundError extends Error {
  constructor() {
    super('booking_not_found');
  }
}
export class NotHostError extends Error {
  constructor() {
    super('not_host');
  }
}
export class InvalidStatusError extends Error {
  constructor(public readonly status: string) {
    super(`invalid_status:${status}`);
  }
}
export class WrongEventError extends Error {
  constructor() {
    super('wrong_event');
  }
}

export async function book(
  eventId: string,
  userId: string,
  seatCount: number,
  payments: Payments,
): Promise<BookResult> {
  // 1) Reserve the hold transactionally (availability + seats_held + booking row).
  const reservation = await db.transaction(async (tx) => {
    const [e] = await tx
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), isNull(events.deletedAt)))
      .for('update')
      .limit(1);
    if (!e) throw new EventNotFoundError();
    const available = e.seatCount - e.seatsBooked - e.seatsHeld;
    if (seatCount > available) throw new RoomFullError();
    const amountCents = e.priceCents * seatCount;
    await tx
      .update(events)
      .set({ seatsHeld: e.seatsHeld + seatCount })
      .where(eq(events.id, eventId));
    const [b] = await tx
      .insert(bookings)
      .values({
        eventId,
        userId,
        status: 'held',
        seatCount,
        amountCents,
        heldUntil: new Date(Date.now() + bookingHoldWindowMs()),
      })
      .returning();
    return { booking: b!, currency: e.currency, amountCents };
  });

  // 2) Create the PaymentIntent (external), then attach its id.
  const pi = await payments.createPaymentIntent({
    amountCents: reservation.amountCents,
    currency: reservation.currency,
    metadata: { kind: 'booking', bookingId: reservation.booking.id, eventId, userId },
  });
  await db.update(bookings).set({ stripePiId: pi.id }).where(eq(bookings.id, reservation.booking.id));

  return {
    bookingId: reservation.booking.id,
    clientSecret: pi.clientSecret,
    amountCents: reservation.amountCents,
    currency: reservation.currency,
    status: 'held',
  };
}

export interface ConfirmContext {
  booking: BookingRow;
  event: EventRow;
}

/** Idempotent: only a `held` booking transitions to `confirmed`. */
export async function confirmByPaymentIntent(piId: string): Promise<ConfirmContext | null> {
  return db.transaction(async (tx) => {
    const [b] = await tx.select().from(bookings).where(eq(bookings.stripePiId, piId)).limit(1);
    if (!b || b.status !== 'held') return null;
    const [e] = await tx.select().from(events).where(eq(events.id, b.eventId)).for('update').limit(1);
    await tx.update(bookings).set({ status: 'confirmed' }).where(eq(bookings.id, b.id));
    if (e) {
      await tx
        .update(events)
        .set({
          seatsHeld: Math.max(0, e.seatsHeld - b.seatCount),
          seatsBooked: e.seatsBooked + b.seatCount,
        })
        .where(eq(events.id, e.id));
    }
    return e ? { booking: { ...b, status: 'confirmed' }, event: e } : null;
  });
}

export async function releaseByPaymentIntent(piId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [b] = await tx.select().from(bookings).where(eq(bookings.stripePiId, piId)).limit(1);
    if (!b || b.status !== 'held') return;
    const [e] = await tx.select().from(events).where(eq(events.id, b.eventId)).for('update').limit(1);
    await tx
      .update(bookings)
      .set({ status: 'cancelled', cancelledAt: new Date() })
      .where(eq(bookings.id, b.id));
    if (e) {
      await tx
        .update(events)
        .set({ seatsHeld: Math.max(0, e.seatsHeld - b.seatCount) })
        .where(eq(events.id, e.id));
    }
  });
}

/**
 * Records a check-in for a booking. Called by the event host scanning an attendee QR.
 * - Caller must be the host of the booking's event.
 * - Only 'confirmed' bookings can be checked in.
 * - Idempotent: if already checked in, returns success without overwriting checkedInAt.
 */
export async function checkIn(
  eventId: string,
  bookingId: string,
  callerUserId: string,
): Promise<{ checkedInAt: string }> {
  const result = await db.transaction(async (tx) => {
    // Event-ownership gate FIRST: the scanner is scoped to an event the host opened, and a
    // non-host must not be able to probe booking existence. Unknown event → not_host too.
    const [e] = await tx.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!e || e.hostUserId !== callerUserId) throw new NotHostError();

    const [b] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    if (!b) throw new BookingNotFoundError();

    // The scanned ticket must belong to THIS event (closes wrong-event scans for a host who
    // runs more than one event).
    if (b.eventId !== eventId) throw new WrongEventError();

    // Idempotent: already checked in → return the original timestamp, emit nothing.
    if (b.checkedInAt) {
      return { checkedInAt: b.checkedInAt.toISOString(), firstCheckIn: false, attendeeUserId: b.userId };
    }

    // Only confirmed bookings may be checked in.
    if (b.status !== 'confirmed') throw new InvalidStatusError(b.status);

    const now = new Date();
    await tx.update(bookings).set({ checkedInAt: now }).where(eq(bookings.id, bookingId));
    return { checkedInAt: now.toISOString(), firstCheckIn: true, attendeeUserId: b.userId };
  });

  // Emit only on a genuinely-new check-in (never on the idempotent repeat → no double-count).
  if (result.firstCheckIn) {
    trackEvent('attendee_checked_in', {
      eventId,
      bookingId,
      attendeeUserId: result.attendeeUserId,
      hostUserId: callerUserId,
    });
  }
  return { checkedInAt: result.checkedInAt };
}

/**
 * Host roster for an event: its CONFIRMED bookings with the attendee's public identity and
 * check-in state. Host-gated (event ownership). Powers the check-in view + manual fallback.
 */
export async function listEventAttendees(
  eventId: string,
  callerUserId: string,
): Promise<EventAttendee[]> {
  const [e] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!e || e.hostUserId !== callerUserId) throw new NotHostError();

  const rows = await db
    .select({
      bookingId: bookings.id,
      checkedInAt: bookings.checkedInAt,
      attendeeId: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(and(eq(bookings.eventId, eventId), eq(bookings.status, 'confirmed')))
    .orderBy(asc(bookings.bookedAt));

  return rows.map((r) => ({
    bookingId: r.bookingId,
    attendee: { id: r.attendeeId, displayName: r.displayName, avatarUrl: r.avatarUrl },
    checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : null,
  }));
}

/**
 * Lean list of events the caller hosts (newest first), with confirmed + checked-in counts.
 * The Slice-2 entry point to reach an event's check-in scanner — not a full dashboard.
 */
export async function listHostedEvents(callerUserId: string): Promise<HostedEventSummary[]> {
  const evs = await db
    .select()
    .from(events)
    .where(eq(events.hostUserId, callerUserId))
    .orderBy(desc(events.startsAt));
  if (evs.length === 0) return [];

  // One grouped pass for the counts. count(checkedInAt) tallies only non-null timestamps.
  const countRows = await db
    .select({
      eventId: bookings.eventId,
      confirmed: count(),
      checkedIn: count(bookings.checkedInAt),
    })
    .from(bookings)
    .where(
      and(
        inArray(
          bookings.eventId,
          evs.map((e) => e.id),
        ),
        eq(bookings.status, 'confirmed'),
      ),
    )
    .groupBy(bookings.eventId);
  const counts = new Map(countRows.map((c) => [c.eventId, c]));

  const now = Date.now();
  return evs.map((e) => {
    const c = counts.get(e.id);
    const status: HostedEventSummary['status'] = e.deletedAt
      ? 'cancelled'
      : e.endsAt.getTime() < now
        ? 'past'
        : 'upcoming';
    return {
      id: e.id,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      status,
      confirmedCount: Number(c?.confirmed ?? 0),
      checkedInCount: Number(c?.checkedIn ?? 0),
    };
  });
}

/**
 * Releases held bookings whose heldUntil has elapsed. Mirrors releaseByPaymentIntent
 * but operates on expired holds identified by time, not by PI event.
 * Returns the count of bookings released.
 */
export async function releaseExpiredHolds(now: Date): Promise<number> {
  // Find all held bookings where heldUntil is in the past.
  const expired = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, 'held'),
        isNotNull(bookings.heldUntil),
        lt(bookings.heldUntil, now),
      ),
    );

  let released = 0;
  for (const b of expired) {
    await db.transaction(async (tx) => {
      // Re-read inside transaction to guard against races.
      const [fresh] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, b.id))
        .for('update')
        .limit(1);
      if (!fresh || fresh.status !== 'held') return;

      await tx
        .update(bookings)
        .set({ status: 'cancelled', cancelledAt: now })
        .where(eq(bookings.id, fresh.id));

      const [e] = await tx
        .select()
        .from(events)
        .where(eq(events.id, fresh.eventId))
        .for('update')
        .limit(1);
      if (e) {
        await tx
          .update(events)
          .set({ seatsHeld: Math.max(0, e.seatsHeld - fresh.seatCount) })
          .where(eq(events.id, e.id));
      }
    });
    released++;
  }
  return released;
}

export async function listMyBookings(userId: string): Promise<BookingListItem[]> {
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.bookedAt));
  const items: BookingListItem[] = [];
  for (const b of rows) {
    const [e] = await db.select().from(events).where(eq(events.id, b.eventId)).limit(1);
    if (!e) continue;
    // The event's Circle (one per event), if it has been created yet.
    const [circle] = await db.select().from(circles).where(eq(circles.eventId, b.eventId)).limit(1);
    items.push({
      id: b.id,
      status: b.status as BookingStatus,
      seatCount: b.seatCount,
      amountCents: b.amountCents,
      bookedAt: b.bookedAt.toISOString(),
      event: toEventListItem(e),
      circleId: circle?.id ?? null,
      circleMemberCount: circle?.memberCount ?? null,
      refundStatus: b.refundStatus as BookingListItem['refundStatus'],
      refundCents: b.refundCents,
      creditIssuedCents: b.creditIssuedCents,
      checkedInAt: b.checkedInAt ? b.checkedInAt.toISOString() : null,
    });
  }
  return items;
}
