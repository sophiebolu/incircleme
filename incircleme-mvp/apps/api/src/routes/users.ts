import type { FastifyInstance } from 'fastify';
import { getPublicProfile } from '../services/users/publicProfile';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  // Public read-only profile (host/creator). No auth — only public fields are returned.
  app.get('/users/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const profile = await getPublicProfile(id);
    if (!profile) return reply.code(404).send({ error: 'not_found' });
    return profile;
  });
}
