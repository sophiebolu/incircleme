import { z } from 'zod';

/** GET /notifications — newest-first, keyset-paginated by `before` (ISO of last createdAt). */
export const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.string().datetime().optional(),
});
