import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { db, pool, bookings, events } from '@incircleme/db';
import { buildApp } from '../src/app';
import { redis } from '../src/lib/redis';
import { FakePayments } from '../src/lib/payments';
import type { Mailer } from '../src/lib/mailer';
import { expiredHoldsTick } from '../src/jobs/handlers';
import { ECONOMICS } from '@incircleme/config';

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

async function createEventAndHoldBooking(hostToken: string, attendeeToken: string) {
  const evRes = await app.inject({
    method: 'POST',
    url: '/events',
    headers: auth(hostToken),
    payload: {
      title: 'Hold expiry event',
      category: 'wellness',
      neighbourhood: 'Gràcia',
      startsAt: new Date(Date.now() + 3_600_000).toISOString(),
      endsAt: new Date(Date.now() + 7_200_000).toISOString(),
      seatCount: 4,
      priceCents: 1000,
    },
  });
  const ev = evRes.json() as { id: string };

  const booked = await app.inject({
    method: 'POST',
    url: `/events/${ev.id}/book`,
    headers: auth(attendeeToken),
    payload: { seatCount: 1 },
  });
  const bookingId = booked.json().bookingId as string;

  return { eventId: ev.id, bookingId };
}

describe('expiredHoldsTick', () => {
  it('hold window comes from config (ECONOMICS.booking.holdWindowMinutes = 30)', () => {
    // Sanity-check that the config constant is accessible and has the expected value.
    expect(ECONOMICS.booking.holdWindowMinutes).toBe(30);
  });

  it('releases a held booking past its heldUntil and decrements seatsHeld', async () => {
    const host = await signIn('host@holds.com');
    const attendee = await signIn('attendee@holds.com');
    const { eventId, bookingId } = await createEventAndHoldBooking(
      host.accessToken,
      attendee.accessToken,
    );

    // Verify seat is held before expiry.
    const [evBefore] = await db.select().from(events).where(eq(events.id, eventId));
    expect(evBefore!.seatsHeld).toBe(1);

    const [bBefore] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(bBefore!.status).toBe('held');

    // Wind heldUntil into the past so the tick treats it as expired.
    await db
      .update(bookings)
      .set({ heldUntil: new Date(Date.now() - 60_000) })
      .where(eq(bookings.id, bookingId));

    const released = await expiredHoldsTick(new Date());
    expect(released).toBe(1);

    const [bAfter] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(bAfter!.status).toBe('cancelled');
    expect(bAfter!.cancelledAt).not.toBeNull();

    const [evAfter] = await db.select().from(events).where(eq(events.id, eventId));
    expect(evAfter!.seatsHeld).toBe(0);
  });

  it('does NOT release a held booking whose heldUntil is still in the future', async () => {
    const host = await signIn('host2@holds.com');
    const attendee = await signIn('attendee2@holds.com');
    const { eventId, bookingId } = await createEventAndHoldBooking(
      host.accessToken,
      attendee.accessToken,
    );

    // heldUntil is already set to now + holdWindowMinutes — it's within the window.
    const released = await expiredHoldsTick(new Date());
    expect(released).toBe(0);

    const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(b!.status).toBe('held');

    const [ev] = await db.select().from(events).where(eq(events.id, eventId));
    expect(ev!.seatsHeld).toBe(1); // unchanged
  });

  it('idempotent: re-running the tick on already-cancelled bookings does not double-decrement', async () => {
    const host = await signIn('host3@holds.com');
    const attendee = await signIn('attendee3@holds.com');
    const { eventId, bookingId } = await createEventAndHoldBooking(
      host.accessToken,
      attendee.accessToken,
    );

    // Expire the hold.
    await db
      .update(bookings)
      .set({ heldUntil: new Date(Date.now() - 60_000) })
      .where(eq(bookings.id, bookingId));

    const first = await expiredHoldsTick(new Date());
    expect(first).toBe(1);

    // Second run: nothing to release (booking is now 'cancelled', not 'held').
    const second = await expiredHoldsTick(new Date());
    expect(second).toBe(0);

    // seatsHeld must not have gone below 0 or been double-decremented.
    const [ev] = await db.select().from(events).where(eq(events.id, eventId));
    expect(ev!.seatsHeld).toBe(0);

    const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(b!.status).toBe('cancelled');
  });

  it('does NOT release confirmed bookings (only held)', async () => {
    const host = await signIn('host4@holds.com');
    const attendee = await signIn('attendee4@holds.com');
    const { eventId, bookingId } = await createEventAndHoldBooking(
      host.accessToken,
      attendee.accessToken,
    );

    // Manually confirm the booking (simulating the Stripe webhook).
    await db
      .update(bookings)
      .set({ status: 'confirmed', heldUntil: new Date(Date.now() - 60_000) })
      .where(eq(bookings.id, bookingId));
    // Move the seat from held → booked.
    await db.update(events).set({ seatsHeld: 0, seatsBooked: 1 }).where(eq(events.id, eventId));

    const released = await expiredHoldsTick(new Date());
    expect(released).toBe(0);

    const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(b!.status).toBe('confirmed'); // untouched
  });
});
