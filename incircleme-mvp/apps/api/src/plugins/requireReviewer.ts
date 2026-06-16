import type { FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { db, users } from '@incircleme/db';
import { isReviewerRole } from '@incircleme/config';
import { requireAuth } from './auth';

/**
 * preHandler guard for the admin review queue — valid token AND a config-listed
 * reviewer role. Sets request.userId. 401 if unauthenticated, 403 if not a reviewer.
 */
export async function requireReviewer(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  await requireAuth(req, reply);
  if (reply.sent) return;
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
  if (!user || !isReviewerRole(user.role)) {
    return reply.code(403).send({ error: 'not_reviewer' });
  }
}
