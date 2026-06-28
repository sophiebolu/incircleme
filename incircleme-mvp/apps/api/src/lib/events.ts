// Internal domain-event sink for the Booking-Loop arc. A real event bus / suspension
// worker is a later slice — today the production sink logs structured events and the
// host-suspend "signal" is emitted (NOT enforced) per the ADR.
import type { FastifyBaseLogger } from 'fastify';
import type { CancelledBy } from '@incircleme/types';

export interface BookingCancelledEvent {
  bookingId: string;
  eventId: string;
  userId: string;
  actor: CancelledBy;
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
  bookingCancelled(e: BookingCancelledEvent): void;
  hostCancelWarned(e: HostCancelWarning): void;
  hostSuspendSignalled(e: HostSuspendSignal): void;
}

/** Production sink — structured logs (a real bus / suspension worker is deferred). */
export function createDomainEvents(
  logger: Pick<FastifyBaseLogger, 'info' | 'warn'>,
): DomainEvents {
  return {
    bookingCancelled: (e) => logger.info({ evt: 'booking_cancelled', ...e }),
    hostCancelWarned: (e) => logger.warn({ evt: 'host_cancel_warning', ...e }),
    hostSuspendSignalled: (e) => logger.warn({ evt: 'host_suspend_signal', ...e }),
  };
}

/** Test double — records emitted events for assertions (mirrors FakePayments). */
export class FakeDomainEvents implements DomainEvents {
  readonly cancellations: BookingCancelledEvent[] = [];
  readonly warnings: HostCancelWarning[] = [];
  readonly suspendSignals: HostSuspendSignal[] = [];
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
