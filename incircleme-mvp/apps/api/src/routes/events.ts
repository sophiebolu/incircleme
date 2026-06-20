import type { FastifyInstance } from 'fastify';
import { requireActive, requireAuth } from '../plugins/auth';
import { bookSchema, createEventSchema, eventsQuerySchema } from '../schemas/events';
import { createEvent, getEventDetail, listEvents } from '../services/events/events';
import {
  book,
  checkIn,
  BookingNotFoundError,
  EventNotFoundError,
  InvalidStatusError,
  listMyBookings,
  NotHostError,
  RoomFullError,
} from '../services/booking/booking';
import type { Payments } from '../lib/payments';

export async function eventRoutes(
  app: FastifyInstance,
  opts: { payments: Payments },
): Promise<void> {
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
   * POST /bookings/:id/checkin
   * The event host scans an attendee's QR (which encodes the booking id) to record check-in.
   * - Requires auth (the caller must be the host of the booking's event).
   * - Only 'confirmed' bookings can be checked in.
   * - Idempotent: a second call on an already-checked-in booking returns 200 with the
   *   original checkedInAt timestamp unchanged.
   */
  app.post('/bookings/:id/checkin', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const result = await checkIn(id, req.userId!);
      return reply.code(200).send(result);
    } catch (err) {
      if (err instanceof BookingNotFoundError) return reply.code(404).send({ error: 'not_found' });
      if (err instanceof NotHostError) return reply.code(403).send({ error: 'not_host' });
      if (err instanceof InvalidStatusError)
        return reply.code(409).send({ error: 'invalid_status', status: err.status });
      throw err;
    }
  });
}
