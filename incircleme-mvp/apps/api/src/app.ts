import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { env } from './env';
import { registerRateLimit } from './plugins/rateLimit';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { meRoutes } from './routes/me';
import { eventRoutes } from './routes/events';
import { webhookRoutes } from './routes/webhooks';
import { circleRoutes } from './routes/circles';
import { arrivingRoutes } from './routes/arriving';
import { programRoutes } from './routes/programs';
import { adminProgramRoutes } from './routes/admin-programs';
import { publicProgramRoutes } from './routes/public-programs';
import { reviewRoutes } from './routes/reviews';
import { devRoutes } from './routes/dev';
import { createMailer } from './lib/mailer';
import { createPayments } from './lib/payments';
import { createRealtime, nullRealtime } from './lib/realtime';
import { createLocalStorage, uploadsDir } from './lib/storage';
import type { Mailer } from './lib/mailer';
import type { Payments } from './lib/payments';
import type { Realtime } from './lib/realtime';
import type { PhotoStorage } from './lib/storage';

export interface BuildAppOptions {
  /** Inject ports (tests). Default to env-selected implementations. */
  mailer?: Mailer;
  payments?: Payments;
  storage?: PhotoStorage;
  /** Socket.io rides the HTTP server; tests pass nullRealtime implicitly via `realtime: false`. */
  realtime?: boolean;
  logger?: boolean;
}

export async function buildApp(opts: BuildAppOptions = {}) {
  const app = Fastify({ logger: opts.logger ?? true });
  const mailer = opts.mailer ?? createMailer(app.log);
  const payments = opts.payments ?? createPayments(app.log);
  const storage = opts.storage ?? createLocalStorage();
  const realtime: Realtime = opts.realtime === false ? nullRealtime : createRealtime(app);

  // In production restrict CORS to the configured allowlist; dev/test reflect any origin.
  const corsOrigin =
    env.NODE_ENV === 'production'
      ? (env.CORS_ORIGINS?.split(',')
          .map((o) => o.trim())
          .filter(Boolean) ?? [])
      : true;
  await app.register(cors, { origin: corsOrigin });
  await app.register(sensible);
  await app.register(multipart);
  await app.register(fastifyStatic, { root: uploadsDir, prefix: '/uploads/' });
  await registerRateLimit(app);
  await app.register(healthRoutes);
  await app.register(authRoutes, { mailer });
  await app.register(meRoutes);
  await app.register(eventRoutes, { payments });
  await app.register(webhookRoutes, { payments, mailer });
  await app.register(circleRoutes, { realtime });
  await app.register(arrivingRoutes, { storage });
  await app.register(programRoutes, { payments, storage });
  await app.register(adminProgramRoutes, { payments });
  await app.register(publicProgramRoutes);
  await app.register(reviewRoutes);
  // DEV-ONLY quick sign-in — never registered in production.
  if (process.env.NODE_ENV !== 'production') await app.register(devRoutes);
  return app;
}
