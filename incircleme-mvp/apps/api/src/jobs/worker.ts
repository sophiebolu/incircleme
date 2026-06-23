import { Queue, Worker } from 'bullmq';
import { env } from '../env';
import {
  addressUnlockTick,
  arrivingPreTick,
  arrivingPostTick,
  chatPhotoExpiryTick,
  afterlifeEvaluateTick,
  capsuleGenerationTick,
  expiredHoldsTick,
} from './handlers';

// Scheduled-jobs worker (Brief cadences). Run separately: `pnpm --filter @incircleme/api worker`.
if (!env.REDIS_URL) {
  console.error('REDIS_URL required for the jobs worker');
  process.exit(1);
}

// BullMQ's bundled ioredis types clash with our own instance type — pass options instead.
// Carry auth + TLS from the URL so managed Redis (Upstash: rediss:// + password) connects;
// local dev (redis:// no-auth) leaves these undefined and is unaffected.
const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
  maxRetriesPerRequest: null as null,
};
const queue = new Queue('incircleme-jobs', { connection });

const SCHEDULES: Record<string, string> = {
  'address-unlock': '0 * * * *', // hourly
  'arriving-pre': '*/5 * * * *',
  'arriving-post': '*/5 * * * *',
  'chat-photo-expiry': '30 * * * *', // hourly
  'afterlife-evaluate': '0 4 * * *', // daily
  'capsule-generation': '15 * * * *', // hourly (Brief: ends_at + 12h)
  'expired-holds': '*/5 * * * *', // every 5 min — release unpaid holds past heldUntil
};

const HANDLERS: Record<string, (now: Date) => Promise<number>> = {
  'address-unlock': addressUnlockTick,
  'arriving-pre': arrivingPreTick,
  'arriving-post': arrivingPostTick,
  'chat-photo-expiry': chatPhotoExpiryTick,
  'afterlife-evaluate': afterlifeEvaluateTick,
  'capsule-generation': capsuleGenerationTick,
  'expired-holds': expiredHoldsTick,
};

for (const [name, pattern] of Object.entries(SCHEDULES)) {
  await queue.upsertJobScheduler(name, { pattern }, { name });
}

const worker = new Worker(
  'incircleme-jobs',
  async (job) => {
    const handler = HANDLERS[job.name];
    if (!handler) return;
    const touched = await handler(new Date());
    console.log(`[jobs] ${job.name}: touched ${touched}`);
  },
  { connection },
);

worker.on('failed', (job, err) => console.error(`[jobs] ${job?.name} failed:`, err.message));
console.log('[jobs] worker up — schedules:', Object.keys(SCHEDULES).join(', '));
