// In-app notifications inbox (Booking-Loop Stage 2b). The persisting DomainEvents sink writes
// a row per booking event AFTER commit, gated by users.notificationPrefs.bookings; the inbox
// queries below back the API. Scope is the four booking-loop types — legacy job notifications
// (arriving_*, circle_msg, …) share the table but stay out of this surface.
import { and, desc, eq, inArray, isNull, lt, sql } from 'drizzle-orm';
import { db, notifications, users, events } from '@incircleme/db';
import type { Notification, NotificationType, UnreadCount } from '@incircleme/types';
import type {
  BookingCancelledEvent,
  BookingConfirmedEvent,
  DomainEvents,
} from '../../lib/events';
import { createDomainEvents } from '../../lib/events';
import type { FastifyBaseLogger } from 'fastify';

/** The inbox surface — only these types appear in the list, unread count, and mark-all. */
export const INBOX_TYPES: NotificationType[] = [
  'booking_confirmed',
  'booking_cancelled',
  'booking_refunded',
  'host_cancelled',
];

const DEFAULT_LIMIT = 30;

/** Prefs gate — booking notifications are the `bookings` category (config-driven, not hardcoded). */
async function bookingNotificationsEnabled(userId: string): Promise<boolean> {
  const [u] = await db
    .select({ prefs: users.notificationPrefs })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return Boolean(u?.prefs?.bookings);
}

async function insert(row: {
  userId: string;
  type: NotificationType;
  eventId: string | null;
  bookingId: string | null;
  amountCents: number | null;
  creditCents: number | null;
}): Promise<void> {
  if (!(await bookingNotificationsEnabled(row.userId))) return; // disabled category → persist nothing
  await db.insert(notifications).values(row);
}

const CANCEL_KIND_TO_TYPE: Record<BookingCancelledEvent['kind'], NotificationType> = {
  attendee_cancel: 'booking_cancelled',
  host_refund: 'booking_refunded',
  host_event_cancel: 'host_cancelled',
};

async function recordBookingConfirmed(e: BookingConfirmedEvent): Promise<void> {
  await insert({
    userId: e.userId,
    type: 'booking_confirmed',
    eventId: e.eventId,
    bookingId: e.bookingId,
    amountCents: null,
    creditCents: null,
  });
}

async function recordBookingCancelled(e: BookingCancelledEvent): Promise<void> {
  await insert({
    userId: e.userId,
    type: CANCEL_KIND_TO_TYPE[e.kind],
    eventId: e.eventId,
    bookingId: e.bookingId,
    amountCents: e.refundCents > 0 ? e.refundCents : null,
    creditCents: e.creditCents > 0 ? e.creditCents : null,
  });
}

/**
 * Production sink: keeps Stage-1 structured logs AND persists an inbox row per booking event.
 * A persist failure is logged and swallowed — emission is post-commit, so a notification
 * error can never roll back a cancel/refund.
 */
export function createPersistingDomainEvents(
  logger: Pick<FastifyBaseLogger, 'info' | 'warn' | 'error'>,
): DomainEvents {
  const base = createDomainEvents(logger);
  const safe = async (work: () => Promise<void>): Promise<void> => {
    try {
      await work();
    } catch (err) {
      logger.error({ err, evt: 'notification_persist_failed' });
    }
  };
  return {
    bookingConfirmed: async (e) => {
      await base.bookingConfirmed(e);
      await safe(() => recordBookingConfirmed(e));
    },
    bookingCancelled: async (e) => {
      await base.bookingCancelled(e);
      await safe(() => recordBookingCancelled(e));
    },
    hostCancelWarned: (e) => base.hostCancelWarned(e),
    hostSuspendSignalled: (e) => base.hostSuspendSignalled(e),
  };
}

// ── Inbox queries (own rows only — IDOR enforced by user_id in every WHERE) ──────────────

function toDto(r: {
  id: string;
  type: string;
  eventId: string | null;
  bookingId: string | null;
  eventTitle: string | null;
  amountCents: number | null;
  creditCents: number | null;
  readAt: Date | null;
  sentAt: Date;
}): Notification {
  return {
    id: r.id,
    type: r.type as NotificationType,
    eventId: r.eventId,
    bookingId: r.bookingId,
    eventTitle: r.eventTitle,
    amountCents: r.amountCents,
    creditCents: r.creditCents,
    readAt: r.readAt ? r.readAt.toISOString() : null,
    createdAt: r.sentAt.toISOString(),
  };
}

/** Newest first. `before` (ISO of the last row's createdAt) keyset-paginates older rows. */
export async function listNotifications(
  userId: string,
  opts: { limit?: number; before?: string } = {},
): Promise<Notification[]> {
  const limit = Math.min(Math.max(opts.limit ?? DEFAULT_LIMIT, 1), 100);
  const where = [eq(notifications.userId, userId), inArray(notifications.type, INBOX_TYPES)];
  if (opts.before) where.push(lt(notifications.sentAt, new Date(opts.before)));
  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      eventId: notifications.eventId,
      bookingId: notifications.bookingId,
      eventTitle: events.title,
      amountCents: notifications.amountCents,
      creditCents: notifications.creditCents,
      readAt: notifications.readAt,
      sentAt: notifications.sentAt,
    })
    .from(notifications)
    .leftJoin(events, eq(notifications.eventId, events.id))
    .where(and(...where))
    .orderBy(desc(notifications.sentAt))
    .limit(limit);
  return rows.map(toDto);
}

export async function unreadCount(userId: string): Promise<UnreadCount> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        inArray(notifications.type, INBOX_TYPES),
        isNull(notifications.readAt),
      ),
    );
  return { count: row?.count ?? 0 };
}

/** Mark one own row read. Returns false if it isn't the caller's (no IDOR leak). */
export async function markRead(userId: string, id: string): Promise<boolean> {
  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });
  if (updated.length > 0) return true;
  // Distinguish "already read / mine" (ok) from "not mine / missing" (404).
  const [own] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .limit(1);
  return Boolean(own);
}

export async function markAllRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        inArray(notifications.type, INBOX_TYPES),
        isNull(notifications.readAt),
      ),
    );
}
