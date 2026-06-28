import type { FastifyInstance } from 'fastify';
import { requireActive, requireAuth } from '../plugins/auth';
import { notificationsQuerySchema } from '../schemas/notifications';
import {
  listNotifications,
  markAllRead,
  markRead,
  unreadCount,
} from '../services/notifications/notifications';

/**
 * In-app notifications inbox (Booking-Loop Stage 2b). Every handler scopes to req.userId —
 * a caller only ever sees or mutates their own rows (no IDOR).
 */
export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/notifications', { preHandler: [requireAuth, requireActive] }, async (req, reply) => {
    const parsed = notificationsQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_query' });
    return listNotifications(req.userId!, parsed.data);
  });

  app.get(
    '/notifications/unread-count',
    { preHandler: [requireAuth, requireActive] },
    async (req) => unreadCount(req.userId!),
  );

  app.post('/notifications/:id/read', { preHandler: [requireAuth, requireActive] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const ok = await markRead(req.userId!, id);
    if (!ok) return reply.code(404).send({ error: 'not_found' });
    return reply.code(200).send({ ok: true });
  });

  app.post('/notifications/read-all', { preHandler: [requireAuth, requireActive] }, async (req) => {
    await markAllRead(req.userId!);
    return { ok: true };
  });
}
