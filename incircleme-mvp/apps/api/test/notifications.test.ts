import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql, eq, and } from 'drizzle-orm';
import { db, pool, bookings, events, users, notifications } from '@incircleme/db';
import { buildApp } from '../src/app';
import { redis } from '../src/lib/redis';
import { FakePayments } from '../src/lib/payments';
import type { Mailer } from '../src/lib/mailer';

// ── harness ──────────────────────────────────────────────────────────────────
// NOTE: no `events` injection → the app uses the REAL persisting DomainEvents sink, so
// booking events write actual notification rows we can assert on.
const magicLinks: Record<string, string> = {};
const testMailer: Mailer = {
  async sendMagicLink({ to, link }) {
    magicLinks[to] = link;
  },
  async sendBookingConfirmation() {},
};
const fakePayments = new FakePayments();
let app: Awaited<ReturnType<typeof buildApp>>;

const auth = (token: string) => ({ authorization: `Bearer ${token}` });
const tokenFrom = (link: string) => link.match(/token=([^&]+)/)![1]!;
const iso = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

async function signIn(email: string) {
  await app.inject({ method: 'POST', url: '/auth/email-magic-link', payload: { email } });
  const verify = await app.inject({
    method: 'POST',
    url: '/auth/verify',
    payload: { token: tokenFrom(magicLinks[email]!) },
  });
  return verify.json() as { accessToken: string; user: { id: string } };
}

async function makeEvent(hostToken: string, startsInHours = 72): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/events',
    headers: auth(hostToken),
    payload: {
      title: 'Hands in Clay',
      category: 'art_craft',
      neighbourhood: 'Gràcia',
      address: 'Carrer de Verdi 5',
      startsAt: iso(72),
      endsAt: iso(74),
      seatCount: 5,
      priceCents: 2000,
    },
  });
  const id = (res.json() as { id: string }).id;
  const starts = new Date(Date.now() + startsInHours * 3_600_000);
  await db
    .update(events)
    .set({ startsAt: starts, endsAt: new Date(starts.getTime() + 3_600_000) })
    .where(eq(events.id, id));
  return id;
}

async function bookConfirm(eventId: string, token: string): Promise<string> {
  const booked = await app.inject({
    method: 'POST',
    url: `/events/${eventId}/book`,
    headers: auth(token),
    payload: { seatCount: 1 },
  });
  const bookingId = (booked.json() as { bookingId: string }).bookingId;
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  await app.inject({
    method: 'POST',
    url: '/webhooks/stripe',
    payload: { type: 'payment_intent.succeeded', paymentIntentId: b!.stripePiId },
  });
  return bookingId;
}

const rowsFor = (userId: string, type?: string) =>
  db
    .select()
    .from(notifications)
    .where(
      type
        ? and(eq(notifications.userId, userId), eq(notifications.type, type))
        : eq(notifications.userId, userId),
    );

beforeAll(async () => {
  app = await buildApp({ mailer: testMailer, payments: fakePayments, logger: false });
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
    sql`truncate table notifications, bookings, events, sessions, magic_link_tokens, oauth_accounts, users restart identity cascade`,
  );
  for (const k of Object.keys(magicLinks)) delete magicLinks[k];
  fakePayments.refunded.length = 0;
});

// ── persistence per event type ───────────────────────────────────────────────
describe('notification persistence', () => {
  it('booking_confirmed is written when a booking confirms', async () => {
    const host = await signIn('host@n.com');
    const att = await signIn('att@n.com');
    const eventId = await makeEvent(host.accessToken);
    const bookingId = await bookConfirm(eventId, att.accessToken);

    const rows = await rowsFor(att.user.id, 'booking_confirmed');
    expect(rows.length).toBe(1);
    expect(rows[0]!.eventId).toBe(eventId);
    expect(rows[0]!.bookingId).toBe(bookingId);
    expect(rows[0]!.readAt).toBeNull();
  });

  it('booking_cancelled is written on attendee self-cancel', async () => {
    const host = await signIn('host@n.com');
    const att = await signIn('att@n.com');
    const eventId = await makeEvent(host.accessToken);
    const bookingId = await bookConfirm(eventId, att.accessToken);
    await app.inject({ method: 'POST', url: `/bookings/${bookingId}/cancel`, headers: auth(att.accessToken), payload: {} });

    expect((await rowsFor(att.user.id, 'booking_cancelled')).length).toBe(1);
  });

  it('booking_refunded (with amount) is written on host single-booking refund', async () => {
    const host = await signIn('host@n.com');
    const att = await signIn('att@n.com');
    const eventId = await makeEvent(host.accessToken);
    const bookingId = await bookConfirm(eventId, att.accessToken);
    await app.inject({ method: 'POST', url: `/bookings/${bookingId}/refund`, headers: auth(host.accessToken), payload: {} });

    const rows = await rowsFor(att.user.id, 'booking_refunded');
    expect(rows.length).toBe(1);
    expect(rows[0]!.amountCents).toBe(2000);
  });

  it('host event-cancel fans out one host_cancelled per attendee', async () => {
    const host = await signIn('host@n.com');
    const a1 = await signIn('a1@n.com');
    const a2 = await signIn('a2@n.com');
    const eventId = await makeEvent(host.accessToken);
    await bookConfirm(eventId, a1.accessToken);
    await bookConfirm(eventId, a2.accessToken);
    await app.inject({ method: 'POST', url: `/events/${eventId}/cancel`, headers: auth(host.accessToken), payload: {} });

    expect((await rowsFor(a1.user.id, 'host_cancelled')).length).toBe(1);
    expect((await rowsFor(a2.user.id, 'host_cancelled')).length).toBe(1);
    const all = await db.select().from(notifications).where(eq(notifications.type, 'host_cancelled'));
    expect(all.length).toBe(2);
  });

  it('disabled bookings pref → nothing is persisted', async () => {
    const host = await signIn('host@n.com');
    const att = await signIn('att@n.com');
    await db
      .update(users)
      .set({ notificationPrefs: { bookings: false, circles: true, nearby: true } })
      .where(eq(users.id, att.user.id));
    const eventId = await makeEvent(host.accessToken);
    await bookConfirm(eventId, att.accessToken);

    expect((await rowsFor(att.user.id)).length).toBe(0);
  });
});

// ── API: list / unread-count / read / read-all ───────────────────────────────
describe('notifications API', () => {
  const list = (token: string) =>
    app.inject({ method: 'GET', url: '/notifications', headers: auth(token) });
  const unread = (token: string) =>
    app.inject({ method: 'GET', url: '/notifications/unread-count', headers: auth(token) });

  it('list returns only the caller’s rows (no IDOR)', async () => {
    const host = await signIn('host@n.com');
    const a1 = await signIn('a1@n.com');
    const a2 = await signIn('a2@n.com');
    const eventId = await makeEvent(host.accessToken);
    await bookConfirm(eventId, a1.accessToken);
    await bookConfirm(eventId, a2.accessToken);

    const r1 = await list(a1.accessToken);
    const body = r1.json() as Array<{ id: string }>;
    expect(body.length).toBe(1);
    const a1Rows = await rowsFor(a1.user.id);
    expect(body[0]!.id).toBe(a1Rows[0]!.id);
  });

  it('unread-count reflects unread, read-all zeroes it', async () => {
    const host = await signIn('host@n.com');
    const att = await signIn('att@n.com');
    const eventId = await makeEvent(host.accessToken);
    const bookingId = await bookConfirm(eventId, att.accessToken);
    await app.inject({ method: 'POST', url: `/bookings/${bookingId}/cancel`, headers: auth(att.accessToken), payload: {} });

    expect((await unread(att.accessToken)).json()).toEqual({ count: 2 }); // confirmed + cancelled

    const all = await app.inject({ method: 'POST', url: '/notifications/read-all', headers: auth(att.accessToken), payload: {} });
    expect(all.statusCode).toBe(200);
    expect((await unread(att.accessToken)).json()).toEqual({ count: 0 });
  });

  it('mark one read flips only that row; foreign id → 404', async () => {
    const host = await signIn('host@n.com');
    const a1 = await signIn('a1@n.com');
    const a2 = await signIn('a2@n.com');
    const eventId = await makeEvent(host.accessToken);
    await bookConfirm(eventId, a1.accessToken);
    await bookConfirm(eventId, a2.accessToken);

    const a1Row = (await rowsFor(a1.user.id))[0]!;
    const a2Row = (await rowsFor(a2.user.id))[0]!;

    const ok = await app.inject({ method: 'POST', url: `/notifications/${a1Row.id}/read`, headers: auth(a1.accessToken), payload: {} });
    expect(ok.statusCode).toBe(200);
    expect((await unread(a1.accessToken)).json()).toEqual({ count: 0 });

    // a1 cannot read a2's notification.
    const forbidden = await app.inject({ method: 'POST', url: `/notifications/${a2Row.id}/read`, headers: auth(a1.accessToken), payload: {} });
    expect(forbidden.statusCode).toBe(404);
    expect((await unread(a2.accessToken)).json()).toEqual({ count: 1 }); // untouched
  });

  it('requires auth', async () => {
    expect((await app.inject({ method: 'GET', url: '/notifications' })).statusCode).toBe(401);
  });
});
