import type { FastifyInstance } from 'fastify';
import { isReviewerRole } from '@incircleme/config';
import { requireActive, requireAuth } from '../plugins/auth';
import {
  bookSchema,
  cancelBookingSchema,
  cancelQuoteSchema,
  checkInSchema,
  createEventSchema,
  eventAttendeesSchema,
  eventsQuerySchema,
} from '../schemas/events';
import { createEvent, getEventDetail, listEvents } from '../services/events/events';
import {
  book,
  checkIn,
  BookingNotFoundError,
  EventNotFoundError,
  InvalidStatusError,
  listEventAttendees,
  listMyBookings,
  NotHostError,
  RoomFullError,
  WrongEventError,
} from '../services/booking/booking';
import {
  cancelBooking,
  cancelEventByHost,
  quoteCancel,
  refundBooking,
  NotOwnerError,
} from '../services/booking/cancel';
import { getUserById } from '../services/auth/users';
import type { Payments } from '../lib/payments';
import type { DomainEvents } from '../lib/events';

export async function eventRoutes(
  app: FastifyInstance,
  opts: { payments: Payments; domainEvents: DomainEvents },
): Promise<void> {
  // Host/admin endpoints: a 'trust_reviewer' acts as admin (any event); everyone else is
  // treated as a host and must own the event (ownership enforced in the service).
  const hostOrAdminActor = async (userId: string): Promise<'host' | 'admin'> => {
    const user = await getUserById(userId);
    return user && isReviewerRole(user.role) ? 'admin' : 'host';
  };
  app.get('/events', async (req, reply) => {
    const parsed = eventsQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_query' });
    return listEvents(parsed.data);
  });

  app.get('/events/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const detail = await getEventDetail(id);
    if (!detail) return reply.code(404).send({ error: 'not_found' });
    return detail;
  });

  app.post('/events', { preHandler: [requireAuth, requireActive] }, async (req, reply) => {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_request' });
    }
    const detail = await createEvent(req.userId!, parsed.data);
    return reply.code(201).send(detail);
  });

  app.post('/events/:id/book', { preHandler: [requireAuth, requireActive] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = bookSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
    try {
      const result = await book(id, req.userId!, parsed.data.seatCount ?? 1, opts.payments);
      return reply.code(201).send(result);
    } catch (err) {
      if (err instanceof RoomFullError) return reply.code(409).send({ error: 'room_full' });
      if (err instanceof EventNotFoundError) return reply.code(404).send({ error: 'not_found' });
      throw err;
    }
  });

  app.get('/me/bookings', { preHandler: requireAuth }, async (req) => {
    return listMyBookings(req.userId!);
  });

  /**
   * POST /events/:eventId/checkin  body: { bookingId }
   * The host (running THIS event) scans an attendee's QR (which encodes the booking id) to
   * record check-in. The event is the resource the scanner is scoped to, so it owns the path;
   * the scanned booking id is the payload — and is validated to belong to this event.
   * - Requires auth; caller must host the event in the path (else 403 not_host).
   * - Booking must exist (404), belong to this event (409 wrong_event), and be 'confirmed'
   *   (409 invalid_status).
   * - Idempotent: a second call on an already-checked-in booking returns 200 with the original
   *   checkedInAt timestamp unchanged (and emits no analytics — never double-counts).
   */
  app.post('/events/:eventId/checkin', { preHandler: requireAuth }, async (req, reply) => {
    const { eventId } = req.params as { eventId: string };
    const parsed = checkInSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
    try {
      const result = await checkIn(eventId, parsed.data.bookingId, req.userId!);
      return reply.code(200).send(result);
    } catch (err) {
      if (err instanceof NotHostError) return reply.code(403).send({ error: 'not_host' });
      if (err instanceof BookingNotFoundError) return reply.code(404).send({ error: 'not_found' });
      if (err instanceof WrongEventError) return reply.code(409).send({ error: 'wrong_event' });
      if (err instanceof InvalidStatusError)
        return reply.code(409).send({ error: 'invalid_status', status: err.status });
      throw err;
    }
  });

  /**
   * GET /events/:id/attendees — host roster for the check-in view + manual fallback.
   * Host-gated by event ownership (NOT the admin gate). Confirmed bookings only.
   */
  app.get('/events/:id/attendees', { preHandler: [requireAuth, requireActive] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const attendees = await listEventAttendees(id, req.userId!);
      return reply.code(200).send(eventAttendeesSchema.parse(attendees));
    } catch (err) {
      if (err instanceof NotHostError) return reply.code(403).send({ error: 'not_host' });
      throw err;
    }
  });

  /**
   * GET /bookings/:id/cancel-quote — read-only preview of the refund/credit/deposit the
   * attendee would get, computed by the same pure function cancel uses. Never mutates.
   */
  app.get('/bookings/:id/cancel-quote', { preHandler: [requireAuth, requireActive] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const quote = await quoteCancel(id, req.userId!);
      return reply.code(200).send(cancelQuoteSchema.parse(quote));
    } catch (err) {
      if (err instanceof BookingNotFoundError || err instanceof EventNotFoundError)
        return reply.code(404).send({ error: 'not_found' });
      if (err instanceof NotOwnerError) return reply.code(403).send({ error: 'not_owner' });
      throw err;
    }
  });

  /**
   * POST /bookings/:id/cancel — attendee cancels their own booking.
   * Refund/credit/deposit are resolved from config + timing (ADR 2026-06-28). Idempotent.
   */
  app.post('/bookings/:id/cancel', { preHandler: [requireAuth, requireActive] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = cancelBookingSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
    try {
      const result = await cancelBooking(id, 'attendee', req.userId!, opts.payments, opts.domainEvents, req.log);
      return reply.code(200).send(result);
    } catch (err) {
      if (err instanceof BookingNotFoundError) return reply.code(404).send({ error: 'not_found' });
      if (err instanceof NotOwnerError) return reply.code(403).send({ error: 'not_owner' });
      if (err instanceof InvalidStatusError)
        return reply.code(409).send({ error: 'invalid_status', status: err.status });
      throw err;
    }
  });

  /**
   * POST /events/:id/cancel — host (own event) or admin (any) cancels an event; fans out a
   * full refund to every confirmed attendee + the configured host penalty.
   */
  app.post('/events/:id/cancel', { preHandler: [requireAuth, requireActive] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const actor = await hostOrAdminActor(req.userId!);
    try {
      const result = await cancelEventByHost(id, actor, req.userId!, opts.payments, opts.domainEvents, req.log);
      return reply.code(200).send(result);
    } catch (err) {
      if (err instanceof EventNotFoundError) return reply.code(404).send({ error: 'not_found' });
      if (err instanceof NotHostError) return reply.code(403).send({ error: 'not_host' });
      throw err;
    }
  });

  /**
   * POST /bookings/:id/refund — host (own event) or admin (any) full-refunds a single
   * booking (attendee made whole). Idempotent.
   */
  app.post('/bookings/:id/refund', { preHandler: [requireAuth, requireActive] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const actor = await hostOrAdminActor(req.userId!);
    try {
      const result = await refundBooking(id, actor, req.userId!, opts.payments, opts.domainEvents, req.log);
      return reply.code(200).send(result);
    } catch (err) {
      if (err instanceof BookingNotFoundError) return reply.code(404).send({ error: 'not_found' });
      if (err instanceof EventNotFoundError) return reply.code(404).send({ error: 'not_found' });
      if (err instanceof NotHostError) return reply.code(403).send({ error: 'not_host' });
      if (err instanceof InvalidStatusError)
        return reply.code(409).send({ error: 'invalid_status', status: err.status });
      throw err;
    }
  });
}
