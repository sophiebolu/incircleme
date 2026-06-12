import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { db, pool, bookings, circles, events } from '@incircleme/db';
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
  app = await buildApp({
    mailer: testMailer,
    payments: new FakePayments(),
    realtime: false,
    logger: false,
  });
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
    sql`truncate table notifications, circle_keep_votes, arriving_moments, circle_messages, circle_members, circles, bookings, events, sessions, magic_link_tokens, oauth_accounts, users restart identity cascade`,
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

async function createEventAs(token: string, overrides: Record<string, unknown> = {}) {
  const res = await app.inject({
    method: 'POST',
    url: '/events',
    headers: auth(token),
    payload: {
      title: 'Hands in Clay',
      category: 'art_craft',
      neighbourhood: 'Gràcia',
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      endsAt: new Date(Date.now() + 90_000_000).toISOString(),
      seatCount: 6,
      priceCents: 1000,
      ...overrides,
    },
  });
  return res.json();
}

/** Books + fires the (fake) success webhook = confirmed booking. */
async function confirmedBooking(eventId: string, token: string) {
  const booked = await app.inject({
    method: 'POST',
    url: `/events/${eventId}/book`,
    headers: auth(token),
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

describe('circle lifecycle', () => {
  it('auto-creates the circle on first confirmed booking, host + attendee join', async () => {
    const host = await signIn('host@test.com');
    const ev = await createEventAs(host.accessToken);
    const user = await signIn('marta@test.com');

    expect((await db.select().from(circles)).length).toBe(0);
    await confirmedBooking(ev.id, user.accessToken);

    const all = await db.select().from(circles);
    expect(all.length).toBe(1);
    expect(all[0]!.eventId).toBe(ev.id);
    expect(all[0]!.memberCount).toBe(2);

    const mine = (
      await app.inject({ method: 'GET', url: '/me/circles', headers: auth(user.accessToken) })
    ).json();
    expect(mine.length).toBe(1);
    expect(mine[0].eventTitle).toBe('Hands in Clay');

    // second confirmed booking joins the same circle
    const u2 = await signIn('jordi@test.com');
    await confirmedBooking(ev.id, u2.accessToken);
    expect((await db.select().from(circles)).length).toBe(1);
    const detail = (
      await app.inject({
        method: 'GET',
        url: `/circles/${all[0]!.id}`,
        headers: auth(u2.accessToken),
      })
    ).json();
    expect(detail.members.length).toBe(3);
    expect(detail.members.some((m: { role: string }) => m.role === 'host')).toBe(true);
  });

  it('non-members get 403; address stays hidden while locked', async () => {
    const host = await signIn('host@test.com');
    const ev = await createEventAs(host.accessToken, { address: 'Carrer de Verdi 22' });
    const member = await signIn('in@test.com');
    await confirmedBooking(ev.id, member.accessToken);
    const [circle] = await db.select().from(circles);

    const stranger = await signIn('out@test.com');
    const denied = await app.inject({
      method: 'GET',
      url: `/circles/${circle!.id}`,
      headers: auth(stranger.accessToken),
    });
    expect(denied.statusCode).toBe(403);

    const detail = (
      await app.inject({
        method: 'GET',
        url: `/circles/${circle!.id}`,
        headers: auth(member.accessToken),
      })
    ).json();
    expect(detail.event.address).toBeNull();
    expect(detail.event.addressLocked).toBe(true);
  });
});

describe('messages', () => {
  it('posts, lists in order, paginates with before-cursor', async () => {
    const host = await signIn('host@test.com');
    const ev = await createEventAs(host.accessToken);
    const user = await signIn('marta@test.com');
    await confirmedBooking(ev.id, user.accessToken);
    const [circle] = await db.select().from(circles);

    for (let i = 1; i <= 5; i++) {
      const res = await app.inject({
        method: 'POST',
        url: `/circles/${circle!.id}/messages`,
        headers: auth(user.accessToken),
        payload: { body: `msg ${i}` },
      });
      expect(res.statusCode).toBe(201);
    }
    const all = (
      await app.inject({
        method: 'GET',
        url: `/circles/${circle!.id}/messages`,
        headers: auth(user.accessToken),
      })
    ).json();
    expect(all.map((m: { body: string }) => m.body)).toEqual([
      'msg 1',
      'msg 2',
      'msg 3',
      'msg 4',
      'msg 5',
    ]);

    const page = (
      await app.inject({
        method: 'GET',
        url: `/circles/${circle!.id}/messages?before=${all[2].id}&limit=2`,
        headers: auth(user.accessToken),
      })
    ).json();
    expect(page.map((m: { body: string }) => m.body)).toEqual(['msg 1', 'msg 2']);

    const denied = await app.inject({
      method: 'POST',
      url: `/circles/${circle!.id}/messages`,
      headers: auth((await signIn('out@test.com')).accessToken),
      payload: { body: 'hola' },
    });
    expect(denied.statusCode).toBe(403);
  });
});

describe('afterlife keep vote', () => {
  it('4 yes votes flip kept_at; revoting updates not duplicates', async () => {
    const host = await signIn('host@test.com');
    const ev = await createEventAs(host.accessToken, { seatCount: 8 });
    const members = [];
    for (const email of ['a@t.com', 'b@t.com', 'c@t.com']) {
      const u = await signIn(email);
      await confirmedBooking(ev.id, u.accessToken);
      members.push(u);
    }
    const [circle] = await db.select().from(circles);

    // 3 attendee yes votes — below threshold
    for (const u of members) {
      const res = await app.inject({
        method: 'POST',
        url: `/circles/${circle!.id}/keep`,
        headers: auth(u.accessToken),
        payload: { vote: true },
      });
      expect(res.statusCode).toBe(200);
    }
    let [c] = await db.select().from(circles).where(eq(circles.id, circle!.id));
    expect(c!.keptAt).toBeNull();

    // re-vote by same member doesn't add a 4th
    await app.inject({
      method: 'POST',
      url: `/circles/${circle!.id}/keep`,
      headers: auth(members[0]!.accessToken),
      payload: { vote: true },
    });
    [c] = await db.select().from(circles).where(eq(circles.id, circle!.id));
    expect(c!.keptAt).toBeNull();

    // host's yes is the 4th — kept
    const res = (
      await app.inject({
        method: 'POST',
        url: `/circles/${circle!.id}/keep`,
        headers: auth(host.accessToken),
        payload: { vote: true },
      })
    ).json();
    expect(res.keepYesCount).toBe(4);
    expect(res.kept).toBe(true);
    [c] = await db.select().from(circles).where(eq(circles.id, circle!.id));
    expect(c!.keptAt).not.toBeNull();
  });
});
