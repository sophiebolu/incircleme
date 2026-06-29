import { z } from 'zod';
import { REVIEWS } from '@incircleme/config';

/** GET /events/:id/reviews/public — newest-first, keyset-paginated by `before` (ISO createdAt). */
export const publicReviewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  before: z.string().datetime().optional(),
});

/** POST /reviews/:id/hide — admin soft-hide; reason is optional free text. */
export const hideReviewSchema = z.object({
  reason: z.string().max(500).optional(),
});

// vibeTags accept any string here; the service drops non-canonical keys via
// isVibeTag (config is the source of truth for the valid set).
export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(REVIEWS.ratingMin).max(REVIEWS.ratingMax),
  wouldGoAgain: z.boolean().optional(),
  vibeTags: z.array(z.string()).max(REVIEWS.vibeTags.length).optional(),
  comment: z.string().max(2000).optional(),
  isPublic: z.boolean().optional(),
});
