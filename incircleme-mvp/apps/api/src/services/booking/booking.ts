import { db, bookings, circles, events } from '@incircleme/db';
import type { BookingRow, EventRow } from '@incircleme/db';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { BookingListItem, BookingStatus, BookResult } from '@incircleme/types';
import type { Payments } from '../../lib/payments';
import { toEventListItem } from '../events/events';

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

const HOLD_MINUTES = 30;

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
        heldUntil: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
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
    });
  }
  return items;
}
