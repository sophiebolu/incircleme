// Internal domain-event sink for the Booking-Loop arc. Stage 1 logged structured events;
// Stage 2b adds a persisting sink (services/notifications) that writes the in-app inbox.
// Methods are async-capable: the production sink awaits a post-commit notification write,
// but a write failure is swallowed inside the sink so it can never roll back a cancel/refund.
import type { FastifyBaseLogger } from 'fastify';
import type { CancelledBy } from '@incircleme/types';

/** Distinguishes the three cancel paths so the inbox can pick the right notification copy:
 *  attendee self-cancel · host single-booking refund · host whole-event cancel. */
export type BookingCancelKind = 'attendee_cancel' | 'host_refund' | 'host_event_cancel';

export interface BookingConfirmedEvent {
  bookingId: string;
  eventId: string;
  userId: string;
}

export interface BookingCancelledEvent {
  bookingId: string;
  eventId: string;
  userId: string;
  actor: CancelledBy;
  kind: BookingCancelKind;
  refundCents: number;
  creditCents: number;
  depositForfeited: boolean;
}

export interface HostCancelWarning {
  eventId: string;
  hostUserId: string;
  /** 'gt24h' = ample notice; 'lt24h' = late notice. */
  notice: 'gt24h' | 'lt24h';
  attendeeCount: number;
}

export interface HostSuspendSignal {
  hostUserId: string;
  eventId: string;
  reason: 'host_no_show';
}

export interface DomainEvents {
  bookingConfirmed(e: BookingConfirmedEvent): void | Promise<void>;
  bookingCancelled(e: BookingCancelledEvent): void | Promise<void>;
  hostCancelWarned(e: HostCancelWarning): void | Promise<void>;
  hostSuspendSignalled(e: HostSuspendSignal): void | Promise<void>;
}

/** Base sink — structured logs (a real bus / suspension worker is deferred). The persisting
 *  sink in services/notifications composes over this so logs are kept either way. */
export function createDomainEvents(
  logger: Pick<FastifyBaseLogger, 'info' | 'warn'>,
): DomainEvents {
  return {
    bookingConfirmed: (e) => logger.info({ evt: 'booking_confirmed', ...e }),
    bookingCancelled: (e) => logger.info({ evt: 'booking_cancelled', ...e }),
    hostCancelWarned: (e) => logger.warn({ evt: 'host_cancel_warning', ...e }),
    hostSuspendSignalled: (e) => logger.warn({ evt: 'host_suspend_signal', ...e }),
  };
}

/** Test double — records emitted events for assertions (mirrors FakePayments). */
export class FakeDomainEvents implements DomainEvents {
  readonly confirmations: BookingConfirmedEvent[] = [];
  readonly cancellations: BookingCancelledEvent[] = [];
  readonly warnings: HostCancelWarning[] = [];
  readonly suspendSignals: HostSuspendSignal[] = [];
  bookingConfirmed(e: BookingConfirmedEvent): void {
    this.confirmations.push(e);
  }
  bookingCancelled(e: BookingCancelledEvent): void {
    this.cancellations.push(e);
  }
  hostCancelWarned(e: HostCancelWarning): void {
    this.warnings.push(e);
  }
  hostSuspendSignalled(e: HostSuspendSignal): void {
    this.suspendSignals.push(e);
  }
}
