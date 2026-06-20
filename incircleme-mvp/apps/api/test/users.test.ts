import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { db, pool, bookings } from '@incircleme/db';
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

async function confirmedBooking(userToken: string, eventId: string): Promise<string> {
  const booked = await app.inject({
    method: 'POST',
    url: `/events/${eventId}/book`,
    headers: auth(userToken),
    payload: { seatCount: 1 },
  });
  const { bookingId } = booked.json();
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  await app.inject({
    method: 'POST',
    url: '/webhooks/stripe',
    payload: { type: 'payment_intent.succeeded', paymentIntentId: b!.stripePiId },
  });
  return bookingId;
}

describe('public profile', () => {
  it('composes public fields, events-hosted, reviews aggregate, and upcoming-only events', async () => {
    const host = await signIn('host@test.com');
    // one upcoming + one past event → eventsHosted = 2, upcomingEvents = 1
    const upcoming = (await createEvent(host.accessToken, { title: 'Future' })).json();
    const past = (
      await createEvent(host.accessToken, {
        title: 'Past',
        startsAt: new Date(Date.now() - 90_000_000).toISOString(),
        endsAt: new Date(Date.now() - 86_400_000).toISOString(),
      })
    ).json();

    // an attendee leaves a PUBLIC review on the past event → host aggregate picks it up
    const attendee = await signIn('attendee@test.com');
    const bookingId = await confirmedBooking(attendee.accessToken, past.id);
    await app.inject({
      method: 'POST',
      url: '/reviews',
      headers: auth(attendee.accessToken),
      payload: { bookingId, rating: 5, wouldGoAgain: true, vibeTags: ['felt_included'], isPublic: true },
    });

    const res = await app.inject({ method: 'GET', url: `/users/${host.user.id}` });
    expect(res.statusCode).toBe(200);
    const p = res.json();

    expect(p.id).toBe(host.user.id);
    expect(p.trustTier).toBe('newcomer'); // default
    expect(p.trustLevel).toBe(1); // ladder position
    expect(typeof p.verified).toBe('boolean');
    expect(p.eventsHosted).toBe(2); // upcoming + past
    expect(p.upcomingEvents.map((e: { title: string }) => e.title)).toEqual(['Future']); // future only
    expect(p.reviews.count).toBe(1);
    expect(p.reviews.avgRating).toBe(5);
    expect(p.reviews.wouldGoAgainCount).toBe(1);
    // no private fields leak
    expect(p).not.toHaveProperty('email');
    expect(p).not.toHaveProperty('handle');
    // upcoming id usable to navigate to event detail
    expect(p.upcomingEvents[0].id).toBe(upcoming.id);
  });

  it('404 for an unknown user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/users/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });
});
