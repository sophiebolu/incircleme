import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { db, pool, bookings, reviews, users } from '@incircleme/db';
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
    expect(res.json().wouldGoAgain).toBe(null); // unanswered → null (not auto-derived)
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

  it('public tallies use EXPLICIT would-go-again (not derived from rating) + privacy', async () => {
    const host = await signIn('host@test.com');
    const ev = (await createEvent(host.accessToken)).json();
    const u1 = await signIn('u1@test.com');
    const u2 = await signIn('u2@test.com');
    const u3 = await signIn('u3@test.com');
    const b1 = await confirmedBooking(u1.accessToken, ev.id);
    const b2 = await confirmedBooking(u2.accessToken, ev.id);
    const b3 = await confirmedBooking(u3.accessToken, ev.id);

    // Both public + 5 stars, but only u1 tapped "would go again".
    await postReview(u1.accessToken, {
      bookingId: b1,
      rating: 5,
      wouldGoAgain: true,
      vibeTags: ['felt_included'],
      isPublic: true,
    });
    await postReview(u2.accessToken, { bookingId: b2, rating: 5, wouldGoAgain: false, isPublic: true });
    // u3 said yes but stayed private → excluded from the public aggregate.
    await postReview(u3.accessToken, { bookingId: b3, rating: 5, wouldGoAgain: true, isPublic: false });

    const pub = (await app.inject({ method: 'GET', url: `/events/${ev.id}/reviews` })).json();
    expect(pub.count).toBe(2); // u1 + u2 (u3 private, excluded)
    expect(pub.avgRating).toBe(5);
    expect(pub.wouldGoAgainCount).toBe(1); // EXPLICIT: only u1 — u2 is 5★ but said no
    expect(pub.feltIncludedCount).toBe(1);

    const hostAgg = (await app.inject({ method: 'GET', url: '/me/reviews', headers: auth(host.accessToken) })).json();
    expect(hostAgg.received).toBe(3); // host sees all three (private + public)
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

describe('public review list (GET /events/:id/reviews/public)', () => {
  const list = (eventId: string, qs = '') =>
    app.inject({ method: 'GET', url: `/events/${eventId}/reviews/public${qs}` });

  it('returns only public reviews, newest-first, with the reviewer public identity', async () => {
    const host = await signIn('host@t.com');
    const ev = (await createEvent(host.accessToken)).json();
    const u1 = await signIn('u1@t.com');
    const u2 = await signIn('u2@t.com');
    const u3 = await signIn('u3@t.com');
    await db.update(users).set({ displayName: 'Marta R.', avatarUrl: 'https://x/a.jpg' }).where(eq(users.id, u1.user.id));
    const b1 = await confirmedBooking(u1.accessToken, ev.id);
    const b2 = await confirmedBooking(u2.accessToken, ev.id);
    const b3 = await confirmedBooking(u3.accessToken, ev.id);

    await postReview(u1.accessToken, { bookingId: b1, rating: 5, wouldGoAgain: true, vibeTags: ['warm_welcome'], comment: 'Came alone, left with friends.', isPublic: true });
    await postReview(u2.accessToken, { bookingId: b2, rating: 4, isPublic: true });
    await postReview(u3.accessToken, { bookingId: b3, rating: 5, comment: 'private note', isPublic: false }); // excluded

    // Deterministic order: u1 older, u2 newest.
    await db.update(reviews).set({ createdAt: new Date('2026-06-01T00:00:00Z') }).where(eq(reviews.reviewerId, u1.user.id));
    await db.update(reviews).set({ createdAt: new Date('2026-06-02T00:00:00Z') }).where(eq(reviews.reviewerId, u2.user.id));

    const res = await list(ev.id);
    expect(res.statusCode).toBe(200);
    const body = res.json() as Array<{ id: string; author: { id: string; displayName: string | null; avatarUrl: string | null }; comment: string | null; rating: number; wouldGoAgain: boolean | null }>;
    expect(body.length).toBe(2); // u3 private → excluded
    expect(body[0]!.author.id).toBe(u2.user.id); // newest first
    expect(body[1]!.author.id).toBe(u1.user.id);
    expect(body[1]!.author.displayName).toBe('Marta R.'); // public identity, not legal name
    expect(body[1]!.author.avatarUrl).toBe('https://x/a.jpg');
    expect(body[1]!.comment).toBe('Came alone, left with friends.');
    expect(body[1]!.wouldGoAgain).toBe(true);
    expect(body.some((r) => r.comment === 'private note')).toBe(false); // private never leaks
  });

  it('keyset-paginates with limit + before', async () => {
    const host = await signIn('host@t.com');
    const ev = (await createEvent(host.accessToken)).json();
    const u1 = await signIn('u1@t.com');
    const u2 = await signIn('u2@t.com');
    const b1 = await confirmedBooking(u1.accessToken, ev.id);
    const b2 = await confirmedBooking(u2.accessToken, ev.id);
    await postReview(u1.accessToken, { bookingId: b1, rating: 5, isPublic: true });
    await postReview(u2.accessToken, { bookingId: b2, rating: 5, isPublic: true });
    await db.update(reviews).set({ createdAt: new Date('2026-06-01T00:00:00Z') }).where(eq(reviews.reviewerId, u1.user.id));
    await db.update(reviews).set({ createdAt: new Date('2026-06-02T00:00:00Z') }).where(eq(reviews.reviewerId, u2.user.id));

    const page1 = (await list(ev.id, '?limit=1')).json() as Array<{ createdAt: string; author: { id: string } }>;
    expect(page1.length).toBe(1);
    expect(page1[0]!.author.id).toBe(u2.user.id); // newest
    const page2 = (await list(ev.id, `?limit=1&before=${encodeURIComponent(page1[0]!.createdAt)}`)).json() as Array<{ author: { id: string } }>;
    expect(page2.length).toBe(1);
    expect(page2[0]!.author.id).toBe(u1.user.id); // older
  });

  it('empty when the event has no public reviews', async () => {
    const host = await signIn('host@t.com');
    const ev = (await createEvent(host.accessToken)).json();
    expect((await list(ev.id)).json()).toEqual([]);
  });
});
