import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../plugins/auth';
import { updateMeSchema } from '../schemas/auth';
import {
  deactivateUser,
  getUserById,
  reactivateUser,
  toUser,
  updateUser,
} from '../services/auth/users';
import { getUserStats } from '../services/me/stats';
import { getPassport } from '../services/me/passport';

export async function meRoutes(app: FastifyInstance): Promise<void> {
  app.get('/me', { preHandler: requireAuth }, async (req, reply) => {
    const row = await getUserById(req.userId!);
    if (!row) return reply.code(404).send({ error: 'not_found' });
    return toUser(row);
  });

  app.get('/me/stats', { preHandler: requireAuth }, async (req) => getUserStats(req.userId!));

  app.get('/me/passport', { preHandler: requireAuth }, async (req, reply) => {
    const passport = await getPassport(req.userId!);
    if (!passport) return reply.code(404).send({ error: 'not_found' });
    return passport;
  });

  app.patch('/me', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
    const row = await updateUser(req.userId!, parsed.data);
    return toUser(row);
  });

  // Reversible self-deactivation. Data is fully RETAINED — this is NOT a GDPR erasure
  // (true deletion/anonymisation is a later privacy arc). The client signs the user out;
  // signing back in (or POST /me/reactivate) restores the account.
  app.post('/me/deactivate', { preHandler: requireAuth }, async (req) => {
    return toUser(await deactivateUser(req.userId!));
  });

  app.post('/me/reactivate', { preHandler: requireAuth }, async (req) => {
    return toUser(await reactivateUser(req.userId!));
  });
}
