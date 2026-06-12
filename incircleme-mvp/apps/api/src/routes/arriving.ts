import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../plugins/auth';
import { NotMemberError } from '../services/circles/circles';
import { createMoment, deleteMoment, listMoments, NotOwnerError } from '../services/arriving/arriving';
import type { PhotoStorage } from '../lib/storage';

const STATES = new Set(['before', 'after']);
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export async function arrivingRoutes(
  app: FastifyInstance,
  opts: { storage: PhotoStorage },
): Promise<void> {
  // multipart: fields `state` (before|after) + file `photo`
  app.post('/events/:id/arriving', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!req.isMultipart()) return reply.code(400).send({ error: 'multipart_required' });
    let state: string | undefined;
    let photo: Buffer | undefined;
    let ext = 'jpg';
    for await (const part of req.parts()) {
      if (part.type === 'field' && part.fieldname === 'state') state = String(part.value);
      if (part.type === 'file' && part.fieldname === 'photo') {
        photo = await part.toBuffer();
        ext = (part.filename?.split('.').pop() ?? 'jpg').toLowerCase();
      }
    }
    if (!state || !STATES.has(state) || !photo) {
      return reply.code(400).send({ error: 'invalid_request' });
    }
    if (photo.length > MAX_PHOTO_BYTES) return reply.code(413).send({ error: 'photo_too_large' });
    try {
      const moment = await createMoment(
        id,
        req.userId!,
        state as 'before' | 'after',
        photo,
        ext,
        opts.storage,
      );
      return reply.code(201).send(moment);
    } catch (err) {
      if (err instanceof NotMemberError) return reply.code(403).send({ error: 'not_member' });
      if ((err as Error).message === 'circle_not_found')
        return reply.code(404).send({ error: 'not_found' });
      throw err;
    }
  });

  app.get('/events/:id/arriving', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      return await listMoments(id, req.userId!);
    } catch (err) {
      if (err instanceof NotMemberError) return reply.code(403).send({ error: 'not_member' });
      if ((err as Error).message === 'circle_not_found')
        return reply.code(404).send({ error: 'not_found' });
      throw err;
    }
  });

  app.delete('/arriving/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await deleteMoment(id, req.userId!);
      return reply.code(204).send();
    } catch (err) {
      if (err instanceof NotOwnerError) return reply.code(403).send({ error: 'not_owner' });
      throw err;
    }
  });
}
