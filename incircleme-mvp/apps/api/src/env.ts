import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load the monorepo-root .env regardless of cwd (apps/api/src -> root is ../../..),
// then layer apps/api/.env on top for API-local secrets (e.g. STRIPE_SECRET_KEY).
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: resolve(root, '.env') });
dotenv.config({ path: resolve(root, 'apps/api/.env'), override: true });

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  // Comma-separated allowlist of browser origins. Enforced only in production;
  // dev/test reflect any origin. Empty in prod → deny all cross-origin requests.
  CORS_ORIGINS: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().default(900), // 15 min
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().default(2_592_000), // 30 days
  MAGIC_LINK_TTL_SECONDS: z.coerce.number().default(900), // 15 min
  MAGIC_LINK_SCHEME: z.string().default('incircleme'),

  // OAuth (Phase 2 — paths exist, IDs wired later)
  GOOGLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),

  // Payments (Stripe TEST mode for this slice; Connect in Phase 2)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email (Phase 2 — stub mailer used until a key is present)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('IncircleMe <hola@incircleme.com>'),
});

export const env = schema.parse(process.env);
export type Env = typeof env;
