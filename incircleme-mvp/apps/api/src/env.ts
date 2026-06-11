import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load the monorepo-root .env regardless of cwd (apps/api/src -> root is ../../..).
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: resolve(root, '.env') });

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),

  // Auth
  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().default(900), // 15 min
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().default(2_592_000), // 30 days
  MAGIC_LINK_TTL_SECONDS: z.coerce.number().default(900), // 15 min
  MAGIC_LINK_SCHEME: z.string().default('incircleme'),

  // OAuth (Phase 2 — paths exist, IDs wired later)
  GOOGLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),

  // Email (Phase 2 — stub mailer used until a key is present)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('IncircleMe <hola@incircleme.com>'),
});

export const env = schema.parse(process.env);
export type Env = typeof env;
