import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAccessToken } from '../lib/jwt';
import { getUserById } from '../services/auth/users';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

/** preHandler guard — requires a valid Bearer access token; sets request.userId. */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'unauthorized' });
  }
  const token = header.slice('Bearer '.length);
  try {
    const claims = await verifyAccessToken(token);
    request.userId = claims.sub;
  } catch {
    return reply.code(401).send({ error: 'unauthorized' });
  }
}

/**
 * preHandler guard — run after requireAuth. Blocks deactivated accounts from
 * acting (booking, hosting). Reading endpoints stay open; the user reactivates by
 * signing in again (or POST /me/reactivate).
 */
export async function requireActive(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.userId) return reply.code(401).send({ error: 'unauthorized' });
  const user = await getUserById(request.userId);
  if (!user || user.deactivatedAt) {
    return reply.code(403).send({ error: 'account_deactivated' });
  }
}
