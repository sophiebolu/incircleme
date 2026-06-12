import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { registerRateLimit } from './plugins/rateLimit';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { meRoutes } from './routes/me';
import { eventRoutes } from './routes/events';
import { webhookRoutes } from './routes/webhooks';
import { createMailer } from './lib/mailer';
import { createPayments } from './lib/payments';
import type { Mailer } from './lib/mailer';
import type { Payments } from './lib/payments';

export interface BuildAppOptions {
  /** Inject a mailer / payments port (tests). Default to env-selected implementations. */
  mailer?: Mailer;
  payments?: Payments;
  logger?: boolean;
}

export async function buildApp(opts: BuildAppOptions = {}) {
  const app = Fastify({ logger: opts.logger ?? true });
  const mailer = opts.mailer ?? createMailer(app.log);
  const payments = opts.payments ?? createPayments(app.log);

  await app.register(cors, { origin: true });
  await app.register(sensible);
  await registerRateLimit(app);
  await app.register(healthRoutes);
  await app.register(authRoutes, { mailer });
  await app.register(meRoutes);
  await app.register(eventRoutes, { payments });
  await app.register(webhookRoutes, { payments, mailer });
  return app;
}
