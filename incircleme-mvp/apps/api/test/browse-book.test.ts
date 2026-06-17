import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { db, pool, bookings, events } from '@incircleme/db';
import { buildApp } from '../src/app';
import { redis } from '../src/lib/redis';
import { FakePayments } from '../src/lib/payments';
import type { Mailer } from '../src/lib/mailer';

const magicLinks: Record<string, string> = {};
const bookingEmails: Array<{ to: string; vars: Record<string, string> }> = [];
const testMailer: Mailer = {
  async sendMagicLink({ to, link }) {
    magicLinks[to] = link;
  },
  async sendBookingConfirmation({ to, vars }) {
    bookingEmails.push({ to, vars });
  },
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
  await redis?.flushdb(); // reset rate-limit counters so reused emails don't trip 429
  await db.execute(
    sql`truncate table bookings, events, sessions, magic_link_tokens, oauth_accounts, users restart identity cascade`,
  );
  for (const k of Object.keys(magicLinks)) delete magicLinks[k];
  bookingEmails.length = 0;
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
      neighbourhood: 'Gràcia',
      address: 'Carrer de Verdi 22',
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      endsAt: new Date(Date.now() + 90_000_000).toISOString(),
      seatCount: 2,
      priceCents: 2000,
      ...overrides,
    },
  });
}

describe('events', () => {
  it('creates, lists, filters, and hides the address until unlocked', async () => {
    const host = await signIn('host@test.com');
    const created = await createEvent(host.accessToken);
    expect(created.statusCode).toBe(201);
    const ev = created.json();
    expect(ev.address).toBeNull(); // address_locked by default
    expect(ev.addressLocked).toBe(true);
    expect(ev.seatsLeft).toBe(2);
    expect(ev.host.id).toBe(host.user.id);

    await createEvent(host.accessToken, { category: 'wellness', title: 'Sound bath' });

    const all = await app.inject({ method: 'GET', url: '/events' });
    expect(all.json().length).toBe(2);

    const art = await app.inject({ method: 'GET', url: '/events?category=art_craft' });
    expect(art.json().length).toBe(1);
    expect(art.json()[0].title).toBe('Hands in Clay');

    const detail = await app.inject({ method: 'GET', url: `/events/${ev.id}` });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().address).toBeNull();
  });

  it('dateFrom/dateTo filter by start time (powers the discovery when-chips)', async () => {
    const host = await signIn('host@test.com');
    await createEvent(host.accessToken, { title: 'Future' }); // default startsAt = now + 1 day
    await createEvent(host.accessToken, {
      title: 'Past',
      startsAt: new Date(Date.now() - 90_000_000).toISOString(),
      endsAt: new Date(Date.now() - 86_400_000).toISOString(),
    });

    const all = (await app.inject({ method: 'GET', url: '/events' })).json();
    expect(all.length).toBe(2); // no filter → past + future

    const now = new Date().toISOString();
    const upcoming = (
      await app.inject({ method: 'GET', url: `/events?dateFrom=${encodeURIComponent(now)}` })
    ).json();
    expect(upcoming.map((e: { title: string }) => e.title)).toEqual(['Future']);
  });

  it('create requires auth', async () => {
    const res = await createEvent(''); // Bearer with empty token
    expect(res.statusCode).toBe(401);
  });

  it('404 for an unknown event', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/events/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('booking', () => {
  it('book → held → webhook succeeded → confirmed + email; seats move', async () => {
    const host = await signIn('host@test.com');
    const ev = (await createEvent(host.accessToken, { seatCount: 2, priceCents: 2000 })).json();
    const user = await signIn('user@test.com');

    const booked = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/book`,
      headers: auth(user.accessToken),
      payload: { seatCount: 1 },
    });
    expect(booked.statusCode).toBe(201);
    const res = booked.json();
    expect(res.status).toBe('held');
    expect(res.amountCents).toBe(2000);
    expect(res.clientSecret).toContain('_secret_test');

    let detail = (await app.inject({ method: 'GET', url: `/events/${ev.id}` })).json();
    expect(detail.seatsHeld).toBe(1);
    expect(detail.seatsLeft).toBe(1);

    const [b] = await db.select().from(bookings).where(eq(bookings.id, res.bookingId));
    const piId = b!.stripePiId!;

    const wh = await app.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: { type: 'payment_intent.succeeded', paymentIntentId: piId },
    });
    expect(wh.statusCode).toBe(200);

    const myb = (
      await app.inject({ method: 'GET', url: '/me/bookings', headers: auth(user.accessToken) })
    ).json();
    expect(myb.length).toBe(1);
    expect(myb[0].status).toBe('confirmed');
    // Circle is auto-created on confirm → bookings expose its id + member count.
    expect(myb[0].circleId).toBeTruthy();
    expect(myb[0].circleMemberCount).toBeGreaterThanOrEqual(1);

    detail = (await app.inject({ method: 'GET', url: `/events/${ev.id}` })).json();
    expect(detail.seatsBooked).toBe(1);
    expect(detail.seatsHeld).toBe(0);

    expect(bookingEmails.length).toBe(1);
    expect(bookingEmails[0]!.to).toBe('user@test.com');
    expect(bookingEmails[0]!.vars.event_title).toBe('Hands in Clay');
  });

  it('"Room full" when no seats left', async () => {
    const host = await signIn('host@test.com');
    const ev = (await createEvent(host.accessToken, { seatCount: 1, priceCents: 1000 })).json();
    const u1 = await signIn('u1@test.com');
    const u2 = await signIn('u2@test.com');

    const first = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/book`,
      headers: auth(u1.accessToken),
      payload: { seatCount: 1 },
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/book`,
      headers: auth(u2.accessToken),
      payload: { seatCount: 1 },
    });
    expect(second.statusCode).toBe(409);
    expect(second.json().error).toBe('room_full');
  });

  it('webhook payment_failed releases the hold', async () => {
    const host = await signIn('host@test.com');
    const ev = (await createEvent(host.accessToken, { seatCount: 1 })).json();
    const user = await signIn('user@test.com');
    const booked = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/book`,
      headers: auth(user.accessToken),
      payload: { seatCount: 1 },
    });
    const [b] = await db.select().from(bookings).where(eq(bookings.id, booked.json().bookingId));

    await app.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: { type: 'payment_intent.payment_failed', paymentIntentId: b!.stripePiId },
    });

    const detail = (await app.inject({ method: 'GET', url: `/events/${ev.id}` })).json();
    expect(detail.seatsHeld).toBe(0);
    expect(detail.seatsLeft).toBe(1);
  });

  it('book requires auth', async () => {
    const host = await signIn('host@test.com');
    const ev = (await createEvent(host.accessToken)).json();
    const res = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/book`,
      payload: { seatCount: 1 },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('me stats', () => {
  it('attended=past confirmed · bookings=upcoming confirmed (no overlap) · hosted=events hosted', async () => {
    const host = await signIn('statshost@test.com');
    const evA = (await createEvent(host.accessToken, { title: 'A' })).json();
    const evB = (await createEvent(host.accessToken, { title: 'B' })).json();
    const user = await signIn('statsuser@test.com');

    const confirmBooking = async (eventId: string) => {
      const booked = await app.inject({
        method: 'POST',
        url: `/events/${eventId}/book`,
        headers: auth(user.accessToken),
        payload: { seatCount: 1 },
      });
      const [b] = await db.select().from(bookings).where(eq(bookings.id, booked.json().bookingId));
      await app.inject({
        method: 'POST',
        url: '/webhooks/stripe',
        payload: { type: 'payment_intent.succeeded', paymentIntentId: b!.stripePiId! },
      });
    };
    await confirmBooking(evA.id);
    await confirmBooking(evB.id);

    const statsFor = async (token: string) =>
      (await app.inject({ method: 'GET', url: '/me/stats', headers: auth(token) })).json();

    // Both events upcoming + confirmed → bookings=2, attended=0
    expect(await statsFor(user.accessToken)).toEqual({ attended: 0, bookings: 2, hosted: 0 });

    // Move event A into the past → counts as attended, leaves bookings (no overlap)
    await db
      .update(events)
      .set({
        startsAt: new Date(Date.now() - 90_000_000),
        endsAt: new Date(Date.now() - 86_400_000),
      })
      .where(eq(events.id, evA.id));
    expect(await statsFor(user.accessToken)).toEqual({ attended: 1, bookings: 1, hosted: 0 });

    // The host hosts both events, attends/books none.
    expect(await statsFor(host.accessToken)).toEqual({ attended: 0, bookings: 0, hosted: 2 });
  });

  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/me/stats' });
    expect(res.statusCode).toBe(401);
  });
});

describe('event detail enrichment', () => {
  it('exposes host stats (verified · eventsHosted) + creator-optional seat-hold', async () => {
    const host = await signIn('eh-host@test.com');
    const evA = (await createEvent(host.accessToken)).json();
    await createEvent(host.accessToken, { title: 'Second' }); // host now runs 2 events

    let detail = (await app.inject({ method: 'GET', url: `/events/${evA.id}` })).json();
    expect(detail.host.eventsHosted).toBe(2);
    expect(typeof detail.host.verified).toBe('boolean'); // exposed (magic-link sign-in verifies)
    expect(detail.host.hostTier).toBe('basic');
    expect(detail.depositRequired).toBe(false);
    expect(detail.depositAmountCents).toBe(0); // no hold → no amount

    // Enable the seat hold → amount comes from config (€5 = 500 cents)
    await db.update(events).set({ depositRequired: true }).where(eq(events.id, evA.id));
    detail = (await app.inject({ method: 'GET', url: `/events/${evA.id}` })).json();
    expect(detail.depositRequired).toBe(true);
    expect(detail.depositAmountCents).toBe(500);
  });
});
