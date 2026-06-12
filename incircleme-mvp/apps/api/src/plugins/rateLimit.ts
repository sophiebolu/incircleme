import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { redis } from '../lib/redis';

// Registered with global:false — only routes that set `config.rateLimit` are limited.
// hook:'preHandler' so the body is parsed before the limiter runs (lets the
// magic-link route key by IP + email). Redis store keeps limits correct across instances.
export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    global: false,
    hook: 'preHandler',
    redis: redis ?? undefined,
  });
}
