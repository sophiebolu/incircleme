// Booking-Loop cancellation & refund service — ADR-Booking-Loop-Refund-Policy-2026-06-28.
// All economics come from @incircleme/config (no inline numbers). Money is integer cents;
// "credit" is platform credit, recorded on the booking (a user credit-ledger is a later slice).
import { and, eq, gt } from 'drizzle-orm';
import { db, bookings, events } from '@incircleme/db';
import type { BookingRow, EventRow } from '@incircleme/db';
import {
  cancellationCutoffHours,
  depositRefundedBeforeCutoff,
  hostNoticeCutoffHours,
  lifeHappensCreditEnabled,
  lifeHappensCreditOncePerUser,
  platformFeeReturnedOnRefund,
  ECONOMICS,
} from '@incircleme/config';
import type {
  CancelledBy,
  CancelQuote,
  HostCancelResult,
  RefundResult,
  RefundStatus,
} from '@incircleme/types';
import type { Payments } from '../../lib/payments';
import type { DomainEvents } from '../../lib/events';
import { BookingNotFoundError, EventNotFoundError, InvalidStatusError, NotHostError } from './booking';

export class NotOwnerError extends Error {
  constructor() {
    super('not_owner');
  }
}

const HOUR_MS = 3_600_000;
const refundIdempotencyKey = (bookingId: string) => `booking-refund-${bookingId}`;

interface Plan {
  refundCents: number;
  creditCents: number;
  depositForfeited: boolean;
  refundStatus: RefundStatus;
}

/** Ticket cash to return on a full refund. Flag locked true → gross (platform absorbs its
 *  fee, attendee made whole). Net-of-fee path is reserved (no current window uses it). */
function fullTicketRefund(amountCents: number): number {
  return platformFeeReturnedOnRefund() ? amountCents : amountCents;
}

/**
 * Pure attendee cancel outcome — refund / credit / deposit resolved by timing vs the
 * configured cutoff. No I/O, no mutation: the same function powers both the read-only
 * cancel-quote and the actual cancel, so the sheet can promise exactly what happens.
 */
export function computeCancelOutcome(input: {
  amountCents: number;
  depositCents: number;
  startsAt: Date;
  now: Date;
  lifeHappensAlreadyUsed: boolean;
}): Plan {
  const hoursUntilStart = (input.startsAt.getTime() - input.now.getTime()) / HOUR_MS;
  const hasDeposit = input.depositCents > 0;
  if (hoursUntilStart >= cancellationCutoffHours()) {
    // ≥ cutoff before start → full cash refund (ticket + deposit), nothing forfeited.
    const depositBack = hasDeposit && depositRefundedBeforeCutoff() ? input.depositCents : 0;
    return {
      refundCents: fullTicketRefund(input.amountCents) + depositBack,
      creditCents: 0,
      depositForfeited: false,
      refundStatus: 'full',
    };
  }
  if (hoursUntilStart >= 0) {
    // < cutoff, genuine cancel before start → NO cash; one-time life-happens credit
    // (= ticket value); deposit forfeited.
    const credit =
      lifeHappensCreditEnabled() && !input.lifeHappensAlreadyUsed ? input.amountCents : 0;
    return { refundCents: 0, creditCents: credit, depositForfeited: hasDeposit, refundStatus: 'none' };
  }
  // Event already started, never cancelled → no-show forfeit (no cash, no credit, deposit kept).
  return { refundCents: 0, creditCents: 0, depositForfeited: hasDeposit, refundStatus: 'none' };
}

/**
 * Read-only cancel quote (GET /bookings/:id/cancel-quote) — computes the SAME outcome
 * cancelBooking() would produce, WITHOUT touching the row or Stripe. Ownership-checked.
 */
export async function quoteCancel(bookingId: string, callerUserId: string): Promise<CancelQuote> {
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!b) throw new BookingNotFoundError();
  if (b.userId !== callerUserId) throw new NotOwnerError();
  const [e] = await db.select().from(events).where(eq(events.id, b.eventId)).limit(1);
  if (!e) throw new EventNotFoundError();

  let lifeHappensAlreadyUsed = false;
  if (lifeHappensCreditOncePerUser()) {
    const prior = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, b.userId),
          eq(bookings.cancelledBy, 'attendee'),
          gt(bookings.creditIssuedCents, 0),
        ),
      )
      .limit(1);
    lifeHappensAlreadyUsed = prior.length > 0;
  }

  const o = computeCancelOutcome({
    amountCents: b.amountCents,
    depositCents: b.depositCents,
    startsAt: e.startsAt,
    now: new Date(),
    lifeHappensAlreadyUsed,
  });
  return {
    refundCents: o.refundCents,
    creditCents: o.creditCents,
    depositForfeited: o.depositForfeited,
    refundStatus: o.refundStatus,
    hasDeposit: b.depositCents > 0,
    cutoffHours: cancellationCutoffHours(),
  };
}

interface Internal {
  bookingId: string;
  eventId: string;
  userId: string;
  plan: Plan;
  actor: CancelledBy;
  fresh: boolean; // false when the booking was already cancelled (idempotent re-call)
}

function rowToInternal(b: BookingRow, actor: CancelledBy): Internal {
  return {
    bookingId: b.id,
    eventId: b.eventId,
    userId: b.userId,
    actor: (b.cancelledBy as CancelledBy | null) ?? actor,
    plan: {
      refundCents: b.refundCents,
      creditCents: b.creditIssuedCents,
      depositForfeited: b.depositForfeited,
      refundStatus: b.refundStatus as RefundStatus,
    },
    fresh: false,
  };
}

/** Apply a computed plan to a confirmed booking inside a tx: refund (idempotent) → free seats
 *  → write refund columns. Returns the internal record for post-commit emit. */
async function applyCancel(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  b: BookingRow,
  e: EventRow,
  actor: CancelledBy,
  plan: Plan,
  payments: Payments,
): Promise<Internal> {
  if (plan.refundCents > 0 && b.stripePiId) {
    await payments.refund(b.stripePiId, refundIdempotencyKey(b.id));
  }
  await tx
    .update(events)
    .set({ seatsBooked: Math.max(0, e.seatsBooked - b.seatCount) })
    .where(eq(events.id, e.id));
  await tx
    .update(bookings)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: actor,
      refundStatus: plan.refundStatus,
      refundCents: plan.refundCents,
      depositForfeited: plan.depositForfeited,
      creditIssuedCents: plan.creditCents,
    })
    .where(eq(bookings.id, b.id));
  return { bookingId: b.id, eventId: b.eventId, userId: b.userId, plan, actor, fresh: true };
}

function toResult(i: Internal): RefundResult {
  return {
    bookingId: i.bookingId,
    status: 'cancelled',
    refundStatus: i.plan.refundStatus,
    refundCents: i.plan.refundCents,
    creditCents: i.plan.creditCents,
    depositForfeited: i.plan.depositForfeited,
    cancelledBy: i.actor,
  };
}

/**
 * Attendee (or system no-show sweep) cancels a single confirmed booking.
 * Outcome is config + timing driven. Idempotent: a second call returns the recorded
 * result without a second Stripe refund.
 */
export async function cancelBooking(
  bookingId: string,
  actor: CancelledBy,
  callerUserId: string | null,
  payments: Payments,
  domainEvents: DomainEvents,
): Promise<RefundResult> {
  const internal = await db.transaction(async (tx) => {
    const [b] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .for('update')
      .limit(1);
    if (!b) throw new BookingNotFoundError();
    if (actor === 'attendee' && callerUserId && b.userId !== callerUserId) throw new NotOwnerError();

    // Idempotent / terminal: already cancelled → return the recorded result, no second refund.
    if (b.status === 'cancelled' || b.status === 'refunded' || b.refundStatus !== 'none') {
      return rowToInternal(b, actor);
    }
    if (b.status !== 'confirmed') throw new InvalidStatusError(b.status);

    const [e] = await tx.select().from(events).where(eq(events.id, b.eventId)).for('update').limit(1);
    if (!e) throw new EventNotFoundError();

    // One-time "life happens" credit — used already if any prior attendee-cancelled booking
    // for this user issued a credit.
    let lifeHappensAlreadyUsed = false;
    if (lifeHappensCreditOncePerUser()) {
      const prior = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.userId, b.userId),
            eq(bookings.cancelledBy, 'attendee'),
            gt(bookings.creditIssuedCents, 0),
          ),
        )
        .limit(1);
      lifeHappensAlreadyUsed = prior.length > 0;
    }

    const plan = computeCancelOutcome({
      amountCents: b.amountCents,
      depositCents: b.depositCents,
      startsAt: e.startsAt,
      now: new Date(),
      lifeHappensAlreadyUsed,
    });
    return applyCancel(tx, b, e, actor, plan, payments);
  });

  if (internal.fresh) {
    domainEvents.bookingCancelled({
      bookingId: internal.bookingId,
      eventId: internal.eventId,
      userId: internal.userId,
      actor: internal.actor,
      refundCents: internal.plan.refundCents,
      creditCents: internal.plan.creditCents,
      depositForfeited: internal.plan.depositForfeited,
    });
  }
  return toResult(internal);
}

/**
 * Host/admin full refund of a single confirmed booking — attendee made whole (ticket +
 * deposit), no credit, no penalty. Idempotent.
 */
export async function refundBooking(
  bookingId: string,
  actor: CancelledBy,
  callerUserId: string | null,
  payments: Payments,
  domainEvents: DomainEvents,
): Promise<RefundResult> {
  const internal = await db.transaction(async (tx) => {
    const [b] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .for('update')
      .limit(1);
    if (!b) throw new BookingNotFoundError();
    const [e] = await tx.select().from(events).where(eq(events.id, b.eventId)).for('update').limit(1);
    if (!e) throw new EventNotFoundError();
    if (actor === 'host' && e.hostUserId !== callerUserId) throw new NotHostError();

    if (b.status === 'cancelled' || b.status === 'refunded' || b.refundStatus !== 'none') {
      return rowToInternal(b, actor);
    }
    if (b.status !== 'confirmed') throw new InvalidStatusError(b.status);

    const plan: Plan = {
      refundCents: fullTicketRefund(b.amountCents) + b.depositCents,
      creditCents: 0,
      depositForfeited: false,
      refundStatus: 'full',
    };
    return applyCancel(tx, b, e, actor, plan, payments);
  });

  if (internal.fresh) {
    domainEvents.bookingCancelled({
      bookingId: internal.bookingId,
      eventId: internal.eventId,
      userId: internal.userId,
      actor: internal.actor,
      refundCents: internal.plan.refundCents,
      creditCents: internal.plan.creditCents,
      depositForfeited: internal.plan.depositForfeited,
    });
  }
  return toResult(internal);
}

/**
 * Host/admin cancels an entire event → fan out to ALL confirmed attendees per
 * hostCancelPenalty (resolved by notice given). All attendees made whole; the penalty
 * sets per-attendee credit + whether the host is warned / suspend-signalled.
 */
export async function cancelEventByHost(
  eventId: string,
  actor: CancelledBy,
  callerUserId: string | null,
  payments: Payments,
  domainEvents: DomainEvents,
): Promise<HostCancelResult> {
  const result = await db.transaction(async (tx) => {
    const [e] = await tx.select().from(events).where(eq(events.id, eventId)).for('update').limit(1);
    if (!e) throw new EventNotFoundError();
    if (actor === 'host' && e.hostUserId !== callerUserId) throw new NotHostError();

    const hoursUntil = (e.startsAt.getTime() - Date.now()) / HOUR_MS;
    const tier: 'gt24h' | 'lt24h' | 'noShow' =
      hoursUntil < 0 ? 'noShow' : hoursUntil > hostNoticeCutoffHours() ? 'gt24h' : 'lt24h';
    const penalty = ECONOMICS.cancellation.hostCancelPenalty[tier];

    const confirmed = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.eventId, eventId), eq(bookings.status, 'confirmed')))
      .for('update');

    let totalRefundCents = 0;
    let totalCreditCents = 0;
    for (const b of confirmed) {
      const plan: Plan = {
        refundCents: fullTicketRefund(b.amountCents) + b.depositCents, // made whole
        creditCents: penalty.creditCentsEach,
        depositForfeited: false,
        refundStatus: 'full',
      };
      await applyCancel(tx, b, e, actor, plan, payments);
      totalRefundCents += plan.refundCents;
      totalCreditCents += plan.creditCents;
    }

    // Soft-cancel the event so it leaves discovery (idempotent if already cancelled).
    await tx.update(events).set({ deletedAt: new Date() }).where(eq(events.id, e.id));

    return {
      hostUserId: e.hostUserId,
      tier,
      penalty,
      attendees: confirmed,
      totalRefundCents,
      totalCreditCents,
    };
  });

  // Emit AFTER commit.
  for (const b of result.attendees) {
    domainEvents.bookingCancelled({
      bookingId: b.id,
      eventId,
      userId: b.userId,
      actor,
      refundCents: fullTicketRefund(b.amountCents) + b.depositCents,
      creditCents: result.penalty.creditCentsEach,
      depositForfeited: false,
    });
  }
  if (result.penalty.warnHost && (result.tier === 'gt24h' || result.tier === 'lt24h')) {
    domainEvents.hostCancelWarned({
      eventId,
      hostUserId: result.hostUserId,
      notice: result.tier,
      attendeeCount: result.attendees.length,
    });
  }
  if (result.penalty.suspendHost) {
    domainEvents.hostSuspendSignalled({
      hostUserId: result.hostUserId,
      eventId,
      reason: 'host_no_show',
    });
  }

  return {
    eventId,
    penalty: result.tier,
    refundedCount: result.attendees.length,
    totalRefundCents: result.totalRefundCents,
    totalCreditCents: result.totalCreditCents,
    hostSuspendSignalled: result.penalty.suspendHost,
  };
}
