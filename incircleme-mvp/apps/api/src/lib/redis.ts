import { Redis } from 'ioredis';
import { env } from '../env';

// Optional in local dev. When absent, the rate-limiter falls back to in-memory.
export const redis = env.REDIS_URL ? new Redis(env.REDIS_URL) : null;
