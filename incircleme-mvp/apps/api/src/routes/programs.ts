import type { FastifyInstance, FastifyReply } from 'fastify';
import { requireAuth } from '../plugins/auth';
import {
  createProgramSchema,
  credentialKindSchema,
  updateProgramSchema,
} from '../schemas/programs';
import {
  addCredential,
  createDraft,
  getMyProgram,
  InvalidStateError,
  listMyPrograms,
  NotOwnerError,
  NotPremiumError,
  ProgramNotFoundError,
  submitProgram,
  updateDraft,
} from '../services/programs/programs';
import type { Payments } from '../lib/payments';
import type { PhotoStorage } from '../lib/storage';

const MAX_CREDENTIAL_BYTES = 10 * 1024 * 1024;

function mapError(err: unknown, reply: FastifyReply): FastifyReply {
  if (err instanceof NotOwnerError) return reply.code(403).send({ error: 'not_owner' });
  if (err instanceof NotPremiumError) return reply.code(403).send({ error: 'not_premium' });
  if (err instanceof ProgramNotFoundError) return reply.code(404).send({ error: 'not_found' });
  if (err instanceof InvalidStateError) return reply.code(409).send({ error: 'invalid_state' });
  throw err;
}

export async function programRoutes(
  app: FastifyInstance,
  opts: { payments: Payments; storage: PhotoStorage },
): Promise<void> {
  app.post('/me/programs', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = createProgramSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
    return reply.code(201).send(await createDraft(req.userId!, parsed.data));
  });

  app.get('/me/programs', { preHandler: requireAuth }, async (req) => listMyPrograms(req.userId!));

  app.get('/me/programs/:id', { preHandler: requireAuth }, async (req, reply) => {
    try {
      return await getMyProgram((req.params as { id: string }).id, req.userId!);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  app.patch('/me/programs/:id', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = updateProgramSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
    try {
      return await updateDraft((req.params as { id: string }).id, req.userId!, parsed.data);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  app.post('/me/programs/:id/credentials', { preHandler: requireAuth }, async (req, reply) => {
    if (!req.isMultipart()) return reply.code(400).send({ error: 'multipart_required' });
    let fileKind: string | undefined;
    let file: Buffer | undefined;
    let ext = 'pdf';
    for await (const part of req.parts()) {
      if (part.type === 'field' && part.fieldname === 'fileKind') fileKind = String(part.value);
      if (part.type === 'file' && part.fieldname === 'file') {
        file = await part.toBuffer();
        ext = (part.filename?.split('.').pop() ?? 'pdf').toLowerCase();
      }
    }
    const kind = credentialKindSchema.safeParse(fileKind);
    if (!kind.success || !file) return reply.code(400).send({ error: 'invalid_request' });
    if (file.length > MAX_CREDENTIAL_BYTES) return reply.code(413).send({ error: 'file_too_large' });
    try {
      return reply
        .code(201)
        .send(
          await addCredential(
            (req.params as { id: string }).id,
            req.userId!,
            kind.data,
            file,
            ext,
            opts.storage,
          ),
        );
    } catch (err) {
      return mapError(err, reply);
    }
  });

  app.post('/me/programs/:id/submit', { preHandler: requireAuth }, async (req, reply) => {
    try {
      return await submitProgram((req.params as { id: string }).id, req.userId!, opts.payments);
    } catch (err) {
      return mapError(err, reply);
    }
  });
}
