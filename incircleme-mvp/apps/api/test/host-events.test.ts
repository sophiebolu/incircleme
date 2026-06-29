import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql } from 'drizzle-orm';
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
    sql`truncate table bookings, events, sessions, magic_link_tokens, oauth_accounts, users restart identity cascade`,
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

async function createEvent(token: string, title: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/events',
    headers: auth(token),
    payload: {
      title,
      category: 'wellness',
      neighbourhood: 'Gràcia',
      address: 'Carrer de Verdi 5',
      startsAt: new Date(Date.now() + 3_600_000).toISOString(),
      endsAt: new Date(Date.now() + 7_200_000).toISOString(),
      seatCount: 6,
      priceCents: 1000,
    },
  });
  return (res.json() as { id: string }).id;
}

/** Book a seat; if confirm=true, fire the Stripe webhook to move held → confirmed. */
async function book(eventId: string, attendeeToken: string, confirm: boolean) {
  const booked = await app.inject({
    method: 'POST',
    url: `/events/${eventId}/book`,
    headers: auth(attendeeToken),
    payload: { seatCount: 1 },
  });
  const bookingId = booked.json().bookingId as string;
  if (confirm) {
    const [b] = await db.select().from(bookings).where(sql`id = ${bookingId}`);
    await app.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: { type: 'payment_intent.succeeded', paymentIntentId: b!.stripePiId },
    });
  }
  return bookingId;
}

describe('GET /events/:id/attendees (host roster)', () => {
  it('host sees confirmed attendees with check-in flags; held/cancelled excluded', async () => {
    const host = await signIn('rosterhost@checkin.com');
    const eventId = await createEvent(host.accessToken, 'Roster event');

    const a1 = await signIn('a1@checkin.com');
    const a2 = await signIn('a2@checkin.com');
    const a3 = await signIn('a3@checkin.com');
    const b1 = await book(eventId, a1.accessToken, true); // confirmed, will be checked in
    await book(eventId, a2.accessToken, true); // confirmed, not checked in
    await book(eventId, a3.accessToken, false); // held → must be excluded

    // Check in a1.
    await app.inject({
      method: 'POST',
      url: `/events/${eventId}/checkin`,
      headers: auth(host.accessToken),
      payload: { bookingId: b1 },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/events/${eventId}/attendees`,
      headers: auth(host.accessToken),
    });
    expect(res.statusCode).toBe(200);
    const roster = res.json() as Array<{ bookingId: string; checkedInAt: string | null; attendee: { id: string } }>;

    // Only the two CONFIRMED bookings — held excluded.
    expect(roster).toHaveLength(2);
    const checkedIn = roster.find((r) => r.bookingId === b1)!;
    const notYet = roster.find((r) => r.bookingId !== b1)!;
    expect(checkedIn.checkedInAt).not.toBeNull();
    expect(notYet.checkedInAt).toBeNull();
    expect(checkedIn.attendee.id).toBe(a1.user.id);
  });

  it('403 for a non-host requesting the roster (IDOR-safe)', async () => {
    const host = await signIn('rosterhost2@checkin.com');
    const eventId = await createEvent(host.accessToken, 'Private roster');
    const attendee = await signIn('nosy@checkin.com');
    await book(eventId, attendee.accessToken, true);

    // The attendee (and anyone who isn't the host) cannot read the roster.
    const res = await app.inject({
      method: 'GET',
      url: `/events/${eventId}/attendees`,
      headers: auth(attendee.accessToken),
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('not_host');
  });

  it('401 when unauthenticated', async () => {
    const host = await signIn('rosterhost3@checkin.com');
    const eventId = await createEvent(host.accessToken, 'Auth roster');
    const res = await app.inject({ method: 'GET', url: `/events/${eventId}/attendees` });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /me/hosted-events', () => {
  it('returns only the caller’s events with correct confirmed/checked-in counts', async () => {
    const hostA = await signIn('hostA@checkin.com');
    const hostB = await signIn('hostB@checkin.com');
    const eA = await createEvent(hostA.accessToken, 'A event');
    await createEvent(hostB.accessToken, 'B event'); // belongs to hostB — must NOT appear for A

    const a1 = await signIn('ha1@checkin.com');
    const a2 = await signIn('ha2@checkin.com');
    const a3 = await signIn('ha3@checkin.com');
    const b1 = await book(eA, a1.accessToken, true); // confirmed → will check in
    await book(eA, a2.accessToken, true); // confirmed, not checked in
    await book(eA, a3.accessToken, false); // held → not counted as confirmed

    await app.inject({
      method: 'POST',
      url: `/events/${eA}/checkin`,
      headers: auth(hostA.accessToken),
      payload: { bookingId: b1 },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/me/hosted-events',
      headers: auth(hostA.accessToken),
    });
    expect(res.statusCode).toBe(200);
    const list = res.json() as Array<{
      id: string;
      title: string;
      status: string;
      confirmedCount: number;
      checkedInCount: number;
    }>;

    expect(list).toHaveLength(1); // only hostA's event
    expect(list[0]!.id).toBe(eA);
    expect(list[0]!.status).toBe('upcoming');
    expect(list[0]!.confirmedCount).toBe(2); // held excluded
    expect(list[0]!.checkedInCount).toBe(1);
  });

  it('returns an empty array for a host with no events', async () => {
    const lonely = await signIn('noevents@checkin.com');
    const res = await app.inject({
      method: 'GET',
      url: '/me/hosted-events',
      headers: auth(lonely.accessToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });
});
