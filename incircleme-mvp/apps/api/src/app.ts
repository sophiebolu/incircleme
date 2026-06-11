import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { registerRateLimit } from './plugins/rateLimit';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { meRoutes } from './routes/me';
import type { Mailer } from './lib/mailer';

export interface BuildAppOptions {
  /** Inject a mailer (tests). Defaults to the env-selected mailer (stub or Resend). */
  mailer?: Mailer;
  logger?: boolean;
}

export async function buildApp(opts: BuildAppOptions = {}) {
  const app = Fastify({ logger: opts.logger ?? true });
  await app.register(cors, { origin: true });
  await app.register(sensible);
  await registerRateLimit(app);
  await app.register(healthRoutes);
  await app.register(authRoutes, { mailer: opts.mailer });
  await app.register(meRoutes);
  return app;
}
