import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { reviewGates } from '@incircleme/config';
import { requireReviewer } from '../plugins/requireReviewer';
import {
  GateChecksRequiredError,
  GoverningBodyRequiredError,
  getReviewDetail,
  listReviewQueue,
  markUnderReview,
  rejectProgram,
  verifyProgram,
} from '../services/programs/review';
import { InvalidStateError, ProgramNotFoundError } from '../services/programs/programs';
import type { Payments } from '../lib/payments';

const verifySchema = z.object({
  tier: z.enum(['verified', 'accredited']),
  governingBodyUrl: z.string().url().optional(),
  gateChecks: z.record(z.boolean()).optional(),
  notes: z.string().max(4000).optional(),
});
const rejectSchema = z.object({ reason: z.string().min(1).max(4000) });

function mapError(err: unknown, reply: FastifyReply): FastifyReply {
  if (err instanceof ProgramNotFoundError) return reply.code(404).send({ error: 'not_found' });
  if (err instanceof InvalidStateError) return reply.code(409).send({ error: 'invalid_state' });
  if (err instanceof GoverningBodyRequiredError)
    return reply.code(400).send({ error: 'governing_body_required' });
  if (err instanceof GateChecksRequiredError)
    return reply.code(400).send({ error: 'gate_checks_required' });
  throw err;
}

const id = (req: { params: unknown }) => (req.params as { id: string }).id;

export async function adminProgramRoutes(
  app: FastifyInstance,
  opts: { payments: Payments },
): Promise<void> {
  app.get('/admin/programs/queue', { preHandler: requireReviewer }, async () => listReviewQueue());

  // The 4-gate checklist (config-driven), so the admin UI renders without hardcoding.
  app.get('/admin/review-gates', { preHandler: requireReviewer }, async () => reviewGates());

  app.get('/admin/programs/:id', { preHandler: requireReviewer }, async (req, reply) => {
    try {
      return await getReviewDetail(id(req));
    } catch (err) {
      return mapError(err, reply);
    }
  });

  app.post('/admin/programs/:id/verify', { preHandler: requireReviewer }, async (req, reply) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
    try {
      return await verifyProgram(id(req), req.userId!, parsed.data);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  app.post('/admin/programs/:id/reject', { preHandler: requireReviewer }, async (req, reply) => {
    const parsed = rejectSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
    try {
      return await rejectProgram(id(req), req.userId!, parsed.data.reason, opts.payments);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  app.post(
    '/admin/programs/:id/under-review',
    { preHandler: requireReviewer },
    async (req, reply) => {
      try {
        return await markUnderReview(id(req), req.userId!);
      } catch (err) {
        return mapError(err, reply);
      }
    },
  );
}
