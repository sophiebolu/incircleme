import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
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

/** Create an event, book it as attendee, confirm via the Stripe webhook, return ids. */
async function setupConfirmedBooking() {
  const host = await signIn('host@checkin.com');
  const evRes = await app.inject({
    method: 'POST',
    url: '/events',
    headers: auth(host.accessToken),
    payload: {
      title: 'Check-in test event',
      category: 'wellness',
      neighbourhood: 'Gràcia',
      address: 'Carrer de Verdi 5',
      startsAt: new Date(Date.now() + 3_600_000).toISOString(),
      endsAt: new Date(Date.now() + 7_200_000).toISOString(),
      seatCount: 4,
      priceCents: 1500,
    },
  });
  const ev = evRes.json() as { id: string };

  const attendee = await signIn('attendee@checkin.com');
  const booked = await app.inject({
    method: 'POST',
    url: `/events/${ev.id}/book`,
    headers: auth(attendee.accessToken),
    payload: { seatCount: 1 },
  });
  const bookingId = booked.json().bookingId as string;

  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  await app.inject({
    method: 'POST',
    url: '/webhooks/stripe',
    payload: { type: 'payment_intent.succeeded', paymentIntentId: b!.stripePiId },
  });

  return { host, attendee, ev, bookingId };
}

describe('POST /events/:eventId/checkin', () => {
  it('success: host checks in a confirmed booking — checkedInAt is set', async () => {
    const { host, ev, bookingId } = await setupConfirmedBooking();

    const res = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/checkin`,
      headers: auth(host.accessToken),
      payload: { bookingId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { checkedInAt: string };
    expect(body.checkedInAt).toBeTruthy();
    expect(new Date(body.checkedInAt).getTime()).toBeGreaterThan(0);

    // Confirm it is persisted in the DB.
    const [row] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(row!.checkedInAt).not.toBeNull();
  });

  it('idempotent: second check-in returns 200, timestamp NOT overwritten', async () => {
    const { host, ev, bookingId } = await setupConfirmedBooking();

    const first = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/checkin`,
      headers: auth(host.accessToken),
      payload: { bookingId },
    });
    expect(first.statusCode).toBe(200);
    const firstTs = first.json().checkedInAt as string;

    // Small delay to ensure a second call would have a different timestamp if it were
    // writing again — but it should not.
    await new Promise((r) => setTimeout(r, 10));

    const second = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/checkin`,
      headers: auth(host.accessToken),
      payload: { bookingId },
    });
    expect(second.statusCode).toBe(200);
    expect(second.json().checkedInAt).toBe(firstTs);

    // DB row unchanged.
    const [row] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(row!.checkedInAt!.toISOString()).toBe(firstTs);
  });

  it('403 when the caller is not the event host', async () => {
    const { attendee, ev, bookingId } = await setupConfirmedBooking();

    // The attendee tries to check themselves in — they are not the host.
    const res = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/checkin`,
      headers: auth(attendee.accessToken),
      payload: { bookingId },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('not_host');
  });

  it('403 when a different host (not this event host) tries to check in', async () => {
    const { ev, bookingId } = await setupConfirmedBooking();

    // A completely different user who happens to host other events.
    const stranger = await signIn('stranger@checkin.com');
    const res = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/checkin`,
      headers: auth(stranger.accessToken),
      payload: { bookingId },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('not_host');
  });

  it('401 when unauthenticated', async () => {
    const { ev, bookingId } = await setupConfirmedBooking();
    const res = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/checkin`,
      payload: { bookingId },
    });
    expect(res.statusCode).toBe(401);
  });

  it('404 for an unknown booking id (host owns the event)', async () => {
    const { host, ev } = await setupConfirmedBooking();
    const res = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/checkin`,
      headers: auth(host.accessToken),
      payload: { bookingId: '00000000-0000-0000-0000-000000000000' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('not_found');
  });

  it('409 wrong_event: right host + valid booking, but scanned against a different event', async () => {
    const { host, bookingId } = await setupConfirmedBooking();

    // The SAME host runs a second event; the attendee's ticket belongs to the first.
    const evB = await app.inject({
      method: 'POST',
      url: '/events',
      headers: auth(host.accessToken),
      payload: {
        title: 'Other event same host',
        category: 'music',
        neighbourhood: 'Gràcia',
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 7_200_000).toISOString(),
        seatCount: 4,
        priceCents: 1000,
      },
    });
    const evBId = (evB.json() as { id: string }).id;

    const res = await app.inject({
      method: 'POST',
      url: `/events/${evBId}/checkin`,
      headers: auth(host.accessToken),
      payload: { bookingId },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('wrong_event');

    // The booking was NOT checked in (it belongs to the other event).
    const [row] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(row!.checkedInAt).toBeNull();
  });

  it('409 when booking is in held status (not confirmed)', async () => {
    const host = await signIn('host3@checkin.com');
    const evRes = await app.inject({
      method: 'POST',
      url: '/events',
      headers: auth(host.accessToken),
      payload: {
        title: 'Held status event',
        category: 'wellness',
        neighbourhood: 'Gràcia',
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 7_200_000).toISOString(),
        seatCount: 4,
        priceCents: 1000,
      },
    });
    const ev = evRes.json() as { id: string };

    const attendee = await signIn('held-attendee@checkin.com');
    const booked = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/book`,
      headers: auth(attendee.accessToken),
      payload: { seatCount: 1 },
    });
    // Booking is in 'held' state — webhook not fired, so status stays 'held'.
    const bookingId = booked.json().bookingId as string;

    const res = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/checkin`,
      headers: auth(host.accessToken),
      payload: { bookingId },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('invalid_status');
    expect(res.json().status).toBe('held');
  });

  it('409 when booking is cancelled', async () => {
    const { host, ev, bookingId } = await setupConfirmedBooking();

    // Manually cancel the booking in the DB.
    await db
      .update(bookings)
      .set({ status: 'cancelled', cancelledAt: new Date() })
      .where(eq(bookings.id, bookingId));

    const res = await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/checkin`,
      headers: auth(host.accessToken),
      payload: { bookingId },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('invalid_status');
    expect(res.json().status).toBe('cancelled');
  });

  it('analytics: emits attendee_checked_in ONCE on first check-in, never on the idempotent repeat', async () => {
    const { host, ev, bookingId, attendee } = await setupConfirmedBooking();

    // trackEvent writes one JSON line via console.info — capture them. NB: read mock.calls
    // BEFORE mockRestore() (restore clears the recorded history).
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    let emitted: Record<string, unknown>[];
    try {
      const post = () =>
        app.inject({
          method: 'POST',
          url: `/events/${ev.id}/checkin`,
          headers: auth(host.accessToken),
          payload: { bookingId },
        });
      await post(); // first → should emit
      await post(); // idempotent repeat → must NOT emit
      emitted = spy.mock.calls
        .map((c) => {
          try {
            return JSON.parse(String(c[0]));
          } catch {
            return null;
          }
        })
        .filter((o): o is Record<string, unknown> => !!o && o.evt === 'attendee_checked_in');
    } finally {
      spy.mockRestore();
    }

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toMatchObject({
      evt: 'attendee_checked_in',
      eventId: ev.id,
      bookingId,
      attendeeUserId: attendee.user.id,
      hostUserId: host.user.id,
    });
  });
});
