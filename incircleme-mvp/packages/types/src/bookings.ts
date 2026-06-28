// Booking cancellation / refund contract — ADR-Booking-Loop-Refund-Policy-2026-06-28.
// Money is integer cents; "credit" is PLATFORM CREDIT, not cash.
import type { BookingStatus } from './events';

/** Who initiated a cancellation (bookings.cancelled_by). */
export type CancelledBy = 'attendee' | 'host' | 'admin' | 'system';

/** Refund lifecycle on a booking (bookings.refund_status). */
export type RefundStatus = 'none' | 'pending' | 'partial' | 'full' | 'failed';

/** Deposit auth lifecycle (bookings.deposit_auth_status) — deposit groundwork (ADR D5).
 *  SCAFFOLDING: no app path reads/writes these yet (Layers 2 & 3 deferred). */
export type DepositAuthStatus =
  | 'none'
  | 'saved'
  | 'authorized'
  | 'captured'
  | 'released'
  | 'expired';

/** A booking's deposit hold (read surface for future Layers 2/3). Money is integer cents. */
export interface Deposit {
  cents: number;
  status: DepositAuthStatus;
  /** Saved card backing the hold (Layer 2). */
  paymentMethodId?: string;
  /** PaymentIntent authorizing the hold (Layer 3). */
  authIntentId?: string;
}

/** Outcome of a single-booking cancel/refund. */
export interface RefundResult {
  bookingId: string;
  status: BookingStatus;
  refundStatus: RefundStatus;
  /** Cash returned to the attendee, in cents (full refund returns the platform fee too). */
  refundCents: number;
  /** One-time platform credit issued in lieu of cash, in cents (not cash). */
  creditCents: number;
  /** Whether the €5 deposit was kept rather than returned. */
  depositForfeited: boolean;
  cancelledBy: CancelledBy;
}

/** Read-only preview of what cancelling a booking would do (GET /bookings/:id/cancel-quote).
 *  Promise-delivery: the cancel sheet renders exactly this before the attendee confirms. */
export interface CancelQuote {
  refundCents: number;
  creditCents: number;
  depositForfeited: boolean;
  refundStatus: RefundStatus;
  /** Whether the booking carries a €5 seat-hold deposit (drives the deposit line). */
  hasDeposit: boolean;
  /** The free-cancellation cutoff in hours (for "within {hours}h" copy). */
  cutoffHours: number;
}

/** Outcome of a host/admin event-cancellation fan-out to all attendees. */
export interface HostCancelResult {
  eventId: string;
  /** Penalty tier resolved by notice given: >24h, <24h, or host no-show. */
  penalty: 'gt24h' | 'lt24h' | 'noShow';
  refundedCount: number;
  totalRefundCents: number;
  totalCreditCents: number;
  hostSuspendSignalled: boolean;
}
