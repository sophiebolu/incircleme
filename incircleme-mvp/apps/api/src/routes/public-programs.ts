import type { FastifyInstance } from 'fastify';
import { getPublicProgram, listPublicPrograms } from '../services/programs/public';

// Public, unauthenticated — browse verified Programs + rich detail.
export async function publicProgramRoutes(app: FastifyInstance): Promise<void> {
  app.get('/programs', async () => listPublicPrograms());

  app.get('/programs/:id', async (req, reply) => {
    const detail = await getPublicProgram((req.params as { id: string }).id);
    if (!detail) return reply.code(404).send({ error: 'not_found' });
    return detail;
  });
}
