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
      title: 'Sunset Yoga',
      category: 'wellness',
      neighbourhood: 'Gràcia',
      address: 'Carrer de Verdi 22',
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      endsAt: new Date(Date.now() + 90_000_000).toISOString(),
      seatCount: 4,
      priceCents: 2000,
      ...overrides,
    },
  });
}

// Book + confirm via the Stripe webhook → a 'confirmed' booking (i.e. attended).
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

function postReview(token: string, payload: Record<string, unknown>) {
  return app.inject({ method: 'POST', url: '/reviews', headers: auth(token), payload });
}

describe('reviews', () => {
  it('creates a review, private by default; public aggregate stays empty', async () => {
    const host = await signIn('host@test.com');
    const ev = (await createEvent(host.accessToken)).json();
    const user = await signIn('attendee@test.com');
    const bookingId = await confirmedBooking(user.accessToken, ev.id);

    const res = await postReview(user.accessToken, {
      bookingId,
      rating: 5,
      vibeTags: ['warm_welcome', 'felt_included'],
      comment: 'Came alone, left with friends.',
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().isPublic).toBe(false); // privacy default
    expect(res.json().hostId).toBe(host.user.id);

    // Event page = public reviews only → still empty.
    const pub = (await app.inject({ method: 'GET', url: `/events/${ev.id}/reviews` })).json();
    expect(pub.count).toBe(0);

    // The reviewer's "given" count went up.
    const mine = (
      await app.inject({ method: 'GET', url: '/me/reviews', headers: auth(user.accessToken) })
    ).json();
    expect(mine.given).toBe(1);
  });

  it('is_public opt-in surfaces the review on the event page with tallies', async () => {
    const host = await signIn('host@test.com');
    const ev = (await createEvent(host.accessToken)).json();
    const u1 = await signIn('u1@test.com');
    const u2 = await signIn('u2@test.com');
    const b1 = await confirmedBooking(u1.accessToken, ev.id);
    const b2 = await confirmedBooking(u2.accessToken, ev.id);

    await postReview(u1.accessToken, { bookingId: b1, rating: 5, vibeTags: ['felt_included'], isPublic: true });
    await postReview(u2.accessToken, { bookingId: b2, rating: 3, isPublic: false }); // private

    const pub = (await app.inject({ method: 'GET', url: `/events/${ev.id}/reviews` })).json();
    expect(pub.count).toBe(1); // only the public one
    expect(pub.avgRating).toBe(5);
    expect(pub.wouldGoAgainCount).toBe(1); // rating 5 >= 4
    expect(pub.feltIncludedCount).toBe(1);

    // Host aggregate sees BOTH (private + public): avg (5+3)/2 = 4.
    const hostAgg = (await app.inject({ method: 'GET', url: '/me/reviews', headers: auth(host.accessToken) })).json();
    expect(hostAgg.received).toBe(2);
  });

  it('rejects a review for a booking that is not yours, not attended, or already reviewed', async () => {
    const host = await signIn('host@test.com');
    const ev = (await createEvent(host.accessToken)).json();
    const user = await signIn('attendee@test.com');
    const other = await signIn('other@test.com');
    const bookingId = await confirmedBooking(user.accessToken, ev.id);

    // not your booking
    expect((await postReview(other.accessToken, { bookingId, rating: 4 })).statusCode).toBe(403);

    // first review ok, second → already reviewed
    expect((await postReview(user.accessToken, { bookingId, rating: 4 })).statusCode).toBe(201);
    expect((await postReview(user.accessToken, { bookingId, rating: 4 })).statusCode).toBe(409);

    // a merely-held (unattended) booking can't be reviewed
    const held = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/book`,
      headers: auth(other.accessToken),
      payload: { seatCount: 1 },
    });
    const heldRes = await postReview(other.accessToken, { bookingId: held.json().bookingId, rating: 4 });
    expect(heldRes.statusCode).toBe(409);
  });

  it('drops non-canonical vibe tags and clamps rating; requires auth', async () => {
    const host = await signIn('host@test.com');
    const ev = (await createEvent(host.accessToken)).json();
    const user = await signIn('attendee@test.com');
    const bookingId = await confirmedBooking(user.accessToken, ev.id);

    const res = await postReview(user.accessToken, {
      bookingId,
      rating: 5,
      vibeTags: ['felt_included', 'not_a_real_tag'],
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().vibeTags).toEqual(['felt_included']);

    const noAuth = await app.inject({ method: 'POST', url: '/reviews', payload: { bookingId, rating: 5 } });
    expect(noAuth.statusCode).toBe(401);
  });
});
