import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql } from 'drizzle-orm';
import { db, pool } from '@incircleme/db';
import { buildApp } from '../src/app';
import { redis } from '../src/lib/redis';
import type { Mailer } from '../src/lib/mailer';

const links: Record<string, string> = {};
const testMailer: Mailer = {
  async sendMagicLink({ to, link }) {
    links[to] = link;
  },
};

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = await buildApp({ mailer: testMailer, logger: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await pool.end();
  await redis?.quit();
});

beforeEach(async () => {
  await db.execute(
    sql`truncate table sessions, magic_link_tokens, oauth_accounts, users restart identity cascade`,
  );
  for (const key of Object.keys(links)) delete links[key];
});

function tokenFrom(link: string): string {
  const match = link.match(/token=([^&]+)/);
  if (!match) throw new Error(`no token in link: ${link}`);
  return match[1]!;
}

async function signIn(email: string) {
  const req = await app.inject({
    method: 'POST',
    url: '/auth/email-magic-link',
    payload: { email },
  });
  expect(req.statusCode).toBe(200);
  const verify = await app.inject({
    method: 'POST',
    url: '/auth/verify',
    payload: { token: tokenFrom(links[email]!) },
  });
  expect(verify.statusCode).toBe(200);
  return verify.json() as { accessToken: string; refreshToken: string; user: { id: string } };
}

describe('magic link', () => {
  it('requests a link (always 200) and signs in, creating a verified user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/email-magic-link',
      payload: { email: 'Marta@Test.com', locale: 'ca' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    expect(links['Marta@Test.com']).toMatch(/^incircleme:\/\/auth\/verify\?token=/);

    const verify = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { token: tokenFrom(links['Marta@Test.com']!) },
    });
    expect(verify.statusCode).toBe(200);
    const body = verify.json();
    expect(body.user.email).toBe('Marta@Test.com');
    expect(body.user.verified).toBe(true);
    expect(body.user.trustTier).toBe('newcomer');
    expect(typeof body.accessToken).toBe('string');
    expect(typeof body.refreshToken).toBe('string');
    expect(body.expiresIn).toBe(900);
  });

  it('rejects an invalid token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { token: 'nope' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('is single-use', async () => {
    await app.inject({ method: 'POST', url: '/auth/email-magic-link', payload: { email: 'once@test.com' } });
    const token = tokenFrom(links['once@test.com']!);
    const first = await app.inject({ method: 'POST', url: '/auth/verify', payload: { token } });
    expect(first.statusCode).toBe(200);
    const second = await app.inject({ method: 'POST', url: '/auth/verify', payload: { token } });
    expect(second.statusCode).toBe(401);
  });

  it('treats email case-insensitively (one user across casings)', async () => {
    const a = await signIn('Case@test.com');
    await app.inject({ method: 'POST', url: '/auth/email-magic-link', payload: { email: 'case@TEST.com' } });
    const b = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { token: tokenFrom(links['case@TEST.com']!) },
    });
    expect(b.json().user.id).toBe(a.user.id);
  });
});

describe('/me', () => {
  it('requires a bearer token', async () => {
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
  });

  it('returns the profile with a valid token, and updates it', async () => {
    const { accessToken } = await signIn('me@test.com');
    const me = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe('me@test.com');

    const patch = await app.inject({
      method: 'PATCH',
      url: '/me',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { displayName: 'Marta', language: 'es' },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().displayName).toBe('Marta');
    expect(patch.json().language).toBe('es');
  });

  it('rejects a garbage token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: 'Bearer not.a.jwt' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('session refresh + logout', () => {
  it('rotates the refresh token and rejects the old one', async () => {
    const { refreshToken } = await signIn('rotate@test.com');
    const refreshed = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken },
    });
    expect(refreshed.statusCode).toBe(200);
    const next = refreshed.json().refreshToken;
    expect(next).not.toBe(refreshToken);

    const reuseOld = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken },
    });
    expect(reuseOld.statusCode).toBe(401);
  });

  it('revokes on logout', async () => {
    const { refreshToken } = await signIn('logout@test.com');
    const logout = await app.inject({
      method: 'DELETE',
      url: '/auth/session',
      payload: { refreshToken },
    });
    expect(logout.statusCode).toBe(204);
    const afterLogout = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken },
    });
    expect(afterLogout.statusCode).toBe(401);
  });
});

describe('rate limiting', () => {
  it('caps magic-link requests at 5 per window (6th -> 429)', async () => {
    const email = `rate-${Date.now()}@test.com`;
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/email-magic-link',
        payload: { email },
      });
      statuses.push(res.statusCode);
    }
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
  });
});

describe('oauth (Phase 2 — IDs wired later)', () => {
  it.skip('google: verifies id_token via JWKS and signs in', () => {});
  it.skip('apple: verifies id_token via JWKS and signs in', () => {});
});
