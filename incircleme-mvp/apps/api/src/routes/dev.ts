import type { FastifyInstance } from 'fastify';
import { db, users } from '@incircleme/db';
import { eq } from 'drizzle-orm';
import { findOrCreateByEmail, toUser } from '../services/auth/users';
import { createSession } from '../services/auth/session';

// DEV-ONLY. Registered only when NODE_ENV !== 'production' (see app.ts), so this
// auth shortcut can never reach a production build. Mints a signed-in session for
// a review host so a plain URL can land already authenticated.
export async function devRoutes(app: FastifyInstance): Promise<void> {
  app.post('/dev/login', async (req, reply) => {
    const body = (req.body ?? {}) as { email?: string; tier?: string; credits?: number };
    const email = body.email ?? 'live-review@incircleme.dev';
    const user = await findOrCreateByEmail(email);
    const [updated] = await db
      .update(users)
      .set({ hostTier: body.tier ?? 'premium', freeProgramCredits: body.credits ?? 0 })
      .where(eq(users.id, user.id))
      .returning();
    const tokens = await createSession(user.id, { userAgent: 'dev-login', ip: req.ip });
    return reply.send({ ...tokens, user: toUser(updated!) });
  });
}
