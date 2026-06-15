import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql } from 'drizzle-orm';
import { db, pool } from '@incircleme/db';
import { buildApp } from '../src/app';
import { redis } from '../src/lib/redis';
import { FakePayments } from '../src/lib/payments';

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = await buildApp({ payments: new FakePayments(), realtime: false, logger: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await pool.end();
  await redis?.quit();
});

beforeEach(async () => {
  await redis?.flushdb();
  await db.execute(sql`truncate table sessions, users restart identity cascade`);
});

describe('dev quick sign-in (NODE_ENV !== production)', () => {
  it('mints a premium session for the default review host', async () => {
    const res = await app.inject({ method: 'POST', url: '/dev/login', payload: {} });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.user.hostTier).toBe('premium');
    expect(body.user.email).toBe('live-review@incircleme.dev');
  });

  it('honours an explicit email + tier + credits', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/dev/login',
      payload: { email: 'someone@test.com', tier: 'basic', credits: 3 },
    });
    const body = res.json();
    expect(body.user.email).toBe('someone@test.com');
    expect(body.user.hostTier).toBe('basic');
    expect(body.user.freeProgramCredits).toBe(3);
  });
});
