import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../plugins/auth';
import {
  castKeepVote,
  getCircleDetail,
  listMessages,
  listMyCircles,
  NotMemberError,
  postMessage,
} from '../services/circles/circles';
import type { Realtime } from '../lib/realtime';

const postMessageSchema = z.object({
  body: z.string().min(1).max(4000),
  attachments: z
    .array(
      z.object({
        type: z.enum(['photo', 'arriving', 'leaving']),
        url: z.string().min(1),
        expiresAt: z.string().datetime().optional(),
      }),
    )
    .optional(),
});

const keepVoteSchema = z.object({ vote: z.boolean() });

const listQuerySchema = z.object({
  before: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function circleRoutes(
  app: FastifyInstance,
  opts: { realtime: Realtime },
): Promise<void> {
  const guard = async (fn: () => Promise<unknown>, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) => {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof NotMemberError) return reply.code(403).send({ error: 'not_member' });
      throw err;
    }
  };

  app.get('/me/circles', { preHandler: requireAuth }, async (req) => listMyCircles(req.userId!));

  app.get('/circles/:id', { preHandler: requireAuth }, async (req, reply) =>
    guard(async () => {
      const { id } = req.params as { id: string };
      const detail = await getCircleDetail(id, req.userId!);
      if (!detail) return reply.code(404).send({ error: 'not_found' });
      return detail;
    }, reply),
  );

  app.get('/circles/:id/messages', { preHandler: requireAuth }, async (req, reply) =>
    guard(async () => {
      const { id } = req.params as { id: string };
      const q = listQuerySchema.safeParse(req.query);
      if (!q.success) return reply.code(400).send({ error: 'invalid_query' });
      return listMessages(id, req.userId!, q.data);
    }, reply),
  );

  app.post('/circles/:id/messages', { preHandler: requireAuth }, async (req, reply) =>
    guard(async () => {
      const { id } = req.params as { id: string };
      const parsed = postMessageSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
      const message = await postMessage(id, req.userId!, parsed.data.body, parsed.data.attachments);
      opts.realtime.emitMessage(id, message);
      return reply.code(201).send(message);
    }, reply),
  );

  app.post('/circles/:id/keep', { preHandler: requireAuth }, async (req, reply) =>
    guard(async () => {
      const { id } = req.params as { id: string };
      const parsed = keepVoteSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
      return castKeepVote(id, req.userId!, parsed.data.vote);
    }, reply),
  );
}
