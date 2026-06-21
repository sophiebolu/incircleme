import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql } from 'drizzle-orm';
import { db, pool } from '@incircleme/db';
import { buildApp } from '../src/app';
import { redis } from '../src/lib/redis';
import { FakePayments } from '../src/lib/payments';
import type { Mailer } from '../src/lib/mailer';

const magicLinks: Record<string, string> = {};
const testMailer: Mailer = {
  async sendMagicLink({ to, link }) {
    magicLinks[to] = link;
  },
  async sendBookingConfirmation() {},
};

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = await buildApp({ mailer: testMailer, payments: new FakePayments(), logger: false });
  await app.ready();
});
afterAll(async () => {
  await app.close();
  await pool.end();
  await redis?.quit();
});
beforeEach(async () => {
  await redis?.flushdb();
  await db.execute(
    sql`truncate table reviews, bookings, events, circles, circle_members, sessions, magic_link_tokens, oauth_accounts, users restart identity cascade`,
  );
  for (const k of Object.keys(magicLinks)) delete magicLinks[k];
});

const tokenFrom = (link: string) => link.match(/token=([^&]+)/)![1]!;
const auth = (token: string) => ({ authorization: `Bearer ${token}` });

async function signIn(email: string) {
  await app.inject({ method: 'POST', url: '/auth/email-magic-link', payload: { email } });
  const verify = await app.inject({
    method: 'POST',
    url: '/auth/verify',
    payload: { token: tokenFrom(magicLinks[email]!) },
  });
  return verify.json() as { accessToken: string; user: { id: string } };
}

function createEvent(token: string, overrides: Record<string, unknown> = {}) {
  return app.inject({
    method: 'POST',
    url: '/events',
    headers: auth(token),
    payload: {
      title: 'Hands in Clay',
      category: 'art_craft',
      neighbourhood: 'Sants',
      address: 'Carrer de Sants 12',
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      endsAt: new Date(Date.now() + 90_000_000).toISOString(),
      seatCount: 6,
      priceCents: 2000,
      ...overrides,
    },
  });
}

const deactivate = (token: string) =>
  app.inject({ method: 'POST', url: '/me/deactivate', headers: auth(token) });

describe('reversible account deactivation', () => {
  it('hides the public profile + listings and blocks hosting/booking while deactivated', async () => {
    const host = await signIn('host@test.com');
    await createEvent(host.accessToken, { title: 'Future' });
    const guest = await signIn('guest@test.com');

    // before: host public profile visible + their event listed
    expect((await app.inject({ method: 'GET', url: `/users/${host.user.id}` })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/events' })).json()).toHaveLength(1);

    // deactivate the host
    const res = await deactivate(host.accessToken);
    expect(res.statusCode).toBe(200);
    expect(res.json().deactivatedAt).toBeTruthy();

    // public profile now hidden (404) and their event drops out of listings
    expect((await app.inject({ method: 'GET', url: `/users/${host.user.id}` })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: '/events' })).json()).toHaveLength(0);

    // hosting + booking are blocked (403 account_deactivated)
    const hostAttempt = await createEvent(host.accessToken, { title: 'Nope' });
    expect(hostAttempt.statusCode).toBe(403);
    // a fresh event from the active guest to attempt booking against
    const ev = (await createEvent(guest.accessToken, { title: 'Guest event' })).json();
    const book = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/book`,
      headers: auth(host.accessToken),
      payload: { seatCount: 1 },
    });
    expect(book.statusCode).toBe(403);

    // data is RETAINED — the user can still read their own /me
    const me = await app.inject({ method: 'GET', url: '/me', headers: auth(host.accessToken) });
    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe('host@test.com');
  });

  it('POST /me/reactivate restores visibility and the ability to act', async () => {
    const host = await signIn('host@test.com');
    await createEvent(host.accessToken, { title: 'Future' });
    await deactivate(host.accessToken);

    const re = await app.inject({ method: 'POST', url: '/me/reactivate', headers: auth(host.accessToken) });
    expect(re.statusCode).toBe(200);
    expect(re.json().deactivatedAt).toBeNull();

    expect((await app.inject({ method: 'GET', url: `/users/${host.user.id}` })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/events' })).json()).toHaveLength(1);
    expect((await createEvent(host.accessToken, { title: 'Again' })).statusCode).toBe(201);
  });

  it('signing back in reactivates a deactivated account', async () => {
    const host = await signIn('host@test.com');
    await deactivate(host.accessToken);

    // a new sign-in for the same email clears deactivatedAt
    const again = await signIn('host@test.com');
    expect(again.user.id).toBe(host.user.id);
    const me = await app.inject({ method: 'GET', url: '/me', headers: auth(again.accessToken) });
    expect(me.json().deactivatedAt).toBeNull();
  });
});
