import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAccessToken } from '../lib/jwt';

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
