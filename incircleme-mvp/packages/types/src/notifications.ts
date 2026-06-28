// In-app notifications inbox (Booking-Loop Stage 2b). In-app only — push delivery deferred.

/** Booking-Loop notification kinds surfaced in the inbox. */
export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_refunded'
  | 'host_cancelled';

/** A single inbox row (GET /notifications). `createdAt` maps from notifications.sent_at. */
export interface Notification {
  id: string;
  type: NotificationType;
  eventId: string | null;
  bookingId: string | null;
  /** Event title, joined for display copy ({event}); null if the event is gone. */
  eventTitle: string | null;
  /** Cash refunded, in cents (booking_refunded / host_cancelled); else null. */
  amountCents: number | null;
  /** Platform credit issued, in cents; else null. */
  creditCents: number | null;
  /** ISO timestamp when read, or null if unread. */
  readAt: string | null;
  createdAt: string;
}

/** Unread tally for the Home bell badge (GET /notifications/unread-count). */
export interface UnreadCount {
  count: number;
}
