import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../plugins/auth';
import { createReviewSchema, publicReviewsQuerySchema } from '../schemas/reviews';
import {
  AlreadyReviewedError,
  BookingNotOwnedError,
  NotAttendedError,
  createReview,
  getEventPublicAggregate,
  listPublicEventReviews,
  getMyReviewCounts,
} from '../services/reviews/reviews';

export async function reviewRoutes(app: FastifyInstance): Promise<void> {
  // Create a review for one of your own confirmed bookings (private by default).
  app.post('/reviews', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_review' });
    try {
      const review = await createReview(req.userId!, parsed.data);
      return reply.code(201).send(review);
    } catch (err) {
      if (err instanceof BookingNotOwnedError)
        return reply.code(403).send({ error: 'not_your_booking' });
      if (err instanceof NotAttendedError) return reply.code(409).send({ error: 'not_attended' });
      if (err instanceof AlreadyReviewedError)
        return reply.code(409).send({ error: 'already_reviewed' });
      throw err;
    }
  });

  // Public event-page aggregate — only `is_public` reviews are ever exposed here.
  app.get('/events/:id/reviews', async (req) => {
    const { id } = req.params as { id: string };
    return getEventPublicAggregate(id);
  });

  // Public event-page review LIST — isPublic only, newest-first, keyset-paginated.
  app.get('/events/:id/reviews/public', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = publicReviewsQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_query' });
    return listPublicEventReviews(id, parsed.data);
  });

  // The signed-in user's own given/received review counts (Passport).
  app.get('/me/reviews', { preHandler: requireAuth }, async (req) =>
    getMyReviewCounts(req.userId!),
  );
}
