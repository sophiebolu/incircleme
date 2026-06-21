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
    sql`truncate table sessions, magic_link_tokens, oauth_accounts, users restart identity cascade`,
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

const patchMe = (token: string, body: Record<string, unknown>) =>
  app.inject({ method: 'PATCH', url: '/me', headers: auth(token), payload: body });
const getMe = (token: string) => app.inject({ method: 'GET', url: '/me', headers: auth(token) });

describe('onboarding preferences', () => {
  it('a fresh user starts un-onboarded with empty picks and bookings-on defaults', async () => {
    const me = (await getMe((await signIn('fresh@test.com')).accessToken)).json();
    expect(me.onboardingCompleted).toBe(false);
    expect(me.intents).toEqual([]);
    expect(me.interests).toEqual([]);
    expect(me.neighbourhood).toBeNull();
    expect(me.notificationPrefs).toEqual({ bookings: true, circles: true, nearby: true });
  });

  it('persists each step (intents → interests → barrio → notifications) saved as you go', async () => {
    const { accessToken } = await signIn('flow@test.com');

    // intent step (mood-tiles + an "I'm here to…" goal, both stored in intents[])
    expect((await patchMe(accessToken, { intents: ['slow_down', 'meet_people', 'host'] })).statusCode).toBe(200);
    // interests step
    await patchMe(accessToken, { interests: ['food_drink', 'wellness', 'art_craft'] });
    // barrio step
    await patchMe(accessToken, { neighbourhood: 'gracia' });
    // notifications step (opt out of nearby; bookings stays locked on)
    await patchMe(accessToken, { notificationPrefs: { nearby: false } });

    const me = (await getMe(accessToken)).json();
    expect(me.intents).toEqual(['slow_down', 'meet_people', 'host']);
    expect(me.interests).toEqual(['food_drink', 'wellness', 'art_craft']);
    expect(me.neighbourhood).toBe('gracia');
    // partial merge: circles untouched (true), nearby off, bookings always-on
    expect(me.notificationPrefs).toEqual({ bookings: true, circles: true, nearby: false });
  });

  it('bookings notifications stay always-on even if a client tries to disable them', async () => {
    const { accessToken } = await signIn('locked@test.com');
    await patchMe(accessToken, { notificationPrefs: { circles: false } });
    const me = (await getMe(accessToken)).json();
    expect(me.notificationPrefs.bookings).toBe(true); // locked
    expect(me.notificationPrefs.circles).toBe(false);
  });

  it('the onboarding_completed flag flips and lets returning users skip onboarding', async () => {
    const { accessToken } = await signIn('done@test.com');
    expect((await getMe(accessToken)).json().onboardingCompleted).toBe(false);
    const res = await patchMe(accessToken, { onboardingCompleted: true });
    expect(res.statusCode).toBe(200);
    expect(res.json().onboardingCompleted).toBe(true);
    expect((await getMe(accessToken)).json().onboardingCompleted).toBe(true);
  });

  it('rejects picks outside the canonical config taxonomies (400)', async () => {
    const { accessToken } = await signIn('bad@test.com');
    expect((await patchMe(accessToken, { intents: ['slow_down', 'not_a_real_intent'] })).statusCode).toBe(400);
    expect((await patchMe(accessToken, { interests: ['food_drink', 'crypto'] })).statusCode).toBe(400);
    expect((await patchMe(accessToken, { neighbourhood: 'narnia' })).statusCode).toBe(400);
    // the "not on the list" sentinel is accepted
    expect((await patchMe(accessToken, { neighbourhood: 'other' })).statusCode).toBe(200);
  });
});
