import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '@incircleme/db';
import { buildApp } from '../src/app';
import { redis } from '../src/lib/redis';
import { FakePayments } from '../src/lib/payments';

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = await buildApp({ payments: new FakePayments(), logger: false });
  await app.ready();
});
afterAll(async () => {
  await app.close();
  await pool.end();
  await redis?.quit();
});

describe('auth providers — graceful gating when credentials are absent', () => {
  it('advertises email always-on and only OAuth providers that are configured', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/providers' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.email).toBe(true);
    // No client IDs in the test env → no OAuth provider is enabled.
    expect(body.oauth).toEqual([]);
  });

  it('returns provider_not_configured (503) for Apple/LinkedIn instead of faking a login', async () => {
    for (const provider of ['apple', 'linkedin']) {
      const res = await app.inject({
        method: 'POST',
        url: `/auth/oauth/${provider}`,
        payload: { idToken: 'whatever.this.is' },
      });
      expect(res.statusCode).toBe(503);
      expect(res.json()).toMatchObject({ error: 'provider_not_configured', provider });
    }
  });

  it('still 404s an unknown provider', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/oauth/myspace',
      payload: { idToken: 'x' },
    });
    expect(res.statusCode).toBe(404);
  });
});
