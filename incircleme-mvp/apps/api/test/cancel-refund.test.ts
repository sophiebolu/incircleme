import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { db, pool, bookings, events } from '@incircleme/db';
import { ECONOMICS } from '@incircleme/config';
import { buildApp } from '../src/app';
import { redis } from '../src/lib/redis';
import { FakePayments } from '../src/lib/payments';
import { FakeDomainEvents } from '../src/lib/events';
import type { Mailer } from '../src/lib/mailer';

// ── harness ──────────────────────────────────────────────────────────────────
const magicLinks: Record<string, string> = {};
const testMailer: Mailer = {
  async sendMagicLink({ to, link }) {
    magicLinks[to] = link;
  },
  async sendBookingConfirmation() {},
};

const fakePayments = new FakePayments();
const fakeEvents = new FakeDomainEvents();
let app: Awaited<ReturnType<typeof buildApp>>;

const auth = (token: string) => ({ authorization: `Bearer ${token}` });
const tokenFrom = (link: string) => link.match(/token=([^&]+)/)![1]!;
const iso = (hoursFromNow: number) => new Date(Date.now() + hoursFromNow * 3_600_000).toISOString();

async function signIn(email: string) {
  await app.inject({ method: 'POST', url: '/auth/email-magic-link', payload: { email } });
  const verify = await app.inject({
    method: 'POST',
    url: '/auth/verify',
    payload: { token: tokenFrom(magicLinks[email]!) },
  });
  return verify.json() as { accessToken: string; user: { id: string } };
}

/** Create a CONFIRMED booking with controllable start time + optional deposit. */
async function confirmedBooking(opts: {
  hostToken: string;
  attendeeToken: string;
  startsInHours: number;
  priceCents: number;
  depositCents?: number;
  depositRequired?: boolean;
  seats?: number;
}): Promise<{ eventId: string; bookingId: string }> {
  const evRes = await app.inject({
    method: 'POST',
    url: '/events',
    headers: auth(opts.hostToken),
    payload: {
      title: 'Cancel test',
      category: 'wellness',
      neighbourhood: 'Gràcia',
      address: 'Carrer de Verdi 5',
      startsAt: iso(72),
      endsAt: iso(74),
      seatCount: opts.seats ?? 5,
      priceCents: opts.priceCents,
    },
  });
  const ev = evRes.json() as { id: string };
  // Re-point timing (and deposit opt-in) directly — the create schema doesn't expose them.
  const starts = new Date(Date.now() + opts.startsInHours * 3_600_000);
  await db
    .update(events)
    .set({
      startsAt: starts,
      endsAt: new Date(starts.getTime() + 3_600_000),
      depositRequired: opts.depositRequired ?? false,
    })
    .where(eq(events.id, ev.id));

  const booked = await app.inject({
    method: 'POST',
    url: `/events/${ev.id}/book`,
    headers: auth(opts.attendeeToken),
    payload: { seatCount: 1 },
  });
  const bookingId = (booked.json() as { bookingId: string }).bookingId;
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  await app.inject({
    method: 'POST',
    url: '/webhooks/stripe',
    payload: { type: 'payment_intent.succeeded', paymentIntentId: b!.stripePiId },
  });
  if (opts.depositCents) {
    await db.update(bookings).set({ depositCents: opts.depositCents }).where(eq(bookings.id, bookingId));
  }
  return { eventId: ev.id, bookingId };
}

const cancel = (bookingId: string, token: string) =>
  app.inject({ method: 'POST', url: `/bookings/${bookingId}/cancel`, headers: auth(token), payload: {} });

beforeAll(async () => {
  app = await buildApp({ mailer: testMailer, payments: fakePayments, events: fakeEvents, logger: false });
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
  fakePayments.refunded.length = 0;
  fakeEvents.cancellations.length = 0;
  fakeEvents.warnings.length = 0;
  fakeEvents.suspendSignals.length = 0;
});

// ── attendee cancel ──────────────────────────────────────────────────────────
describe('attendee cancel', () => {
  it('≥cutoff before start → FULL cash refund (platform fee returned)', async () => {
    expect(ECONOMICS.cancellation.platformFeeReturnedOnRefund).toBe(true); // config-driven
    const host = await signIn('host@c.com');
    const att = await signIn('att@c.com');
    const { bookingId } = await confirmedBooking({
      hostToken: host.accessToken,
      attendeeToken: att.accessToken,
      startsInHours: ECONOMICS.cancellation.cancellationCutoffHours + 4,
      priceCents: 2000,
    });
    const res = await cancel(bookingId, att.accessToken);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.refundStatus).toBe('full');
    expect(body.refundCents).toBe(2000); // full ticket, fee NOT deducted
    expect(body.creditCents).toBe(0);
    expect(body.depositForfeited).toBe(false);
    const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(b!.status).toBe('cancelled');
    expect(fakePayments.refunded.length).toBe(1); // Stripe refund issued
  });

  it('inside cutoff, genuine cancel → NO cash, one-time life-happens credit', async () => {
    const host = await signIn('host@c.com');
    const att = await signIn('att@c.com');
    const a = await confirmedBooking({
      hostToken: host.accessToken,
      attendeeToken: att.accessToken,
      startsInHours: 2,
      priceCents: 2000,
    });
    const res = (await cancel(a.bookingId, att.accessToken)).json();
    expect(res.refundCents).toBe(0); // no cash
    expect(res.creditCents).toBe(2000); // credit = ticket value
    expect(res.refundStatus).toBe('none');
    expect(fakePayments.refunded.length).toBe(0); // no Stripe refund

    // Second late cancel by the SAME user → credit not granted again (oncePerUser).
    const b = await confirmedBooking({
      hostToken: host.accessToken,
      attendeeToken: att.accessToken,
      startsInHours: 3,
      priceCents: 1500,
    });
    const res2 = (await cancel(b.bookingId, att.accessToken)).json();
    expect(res2.creditCents).toBe(0);
  });

  it('no-show (event already started) → forfeit: no cash, no credit', async () => {
    const host = await signIn('host@c.com');
    const att = await signIn('att@c.com');
    const { bookingId } = await confirmedBooking({
      hostToken: host.accessToken,
      attendeeToken: att.accessToken,
      startsInHours: -2,
      priceCents: 2000,
    });
    const res = (await cancel(bookingId, att.accessToken)).json();
    expect(res.refundCents).toBe(0);
    expect(res.creditCents).toBe(0);
    expect(fakePayments.refunded.length).toBe(0);
  });

  it('deposit: refunded ≥cutoff, forfeited late & on no-show', async () => {
    const host = await signIn('host@c.com');
    const dep = ECONOMICS.seatHold.amountCents;
    const before = await confirmedBooking({
      hostToken: host.accessToken,
      attendeeToken: (await signIn('a1@c.com')).accessToken,
      startsInHours: ECONOMICS.cancellation.cancellationCutoffHours + 4,
      priceCents: 2000,
      depositCents: dep,
      depositRequired: true,
    });
    const r1 = (await cancel(before.bookingId, (await signIn('a1@c.com')).accessToken)).json();
    expect(r1.depositForfeited).toBe(false);
    expect(r1.refundCents).toBe(2000 + dep); // ticket + deposit back

    const late = await confirmedBooking({
      hostToken: host.accessToken,
      attendeeToken: (await signIn('a2@c.com')).accessToken,
      startsInHours: 5,
      priceCents: 2000,
      depositCents: dep,
      depositRequired: true,
    });
    const r2 = (await cancel(late.bookingId, (await signIn('a2@c.com')).accessToken)).json();
    expect(r2.depositForfeited).toBe(true);
    expect(r2.refundCents).toBe(0);
  });

  it('refund is idempotent — double cancel does not double-refund', async () => {
    const host = await signIn('host@c.com');
    const att = await signIn('att@c.com');
    const { bookingId } = await confirmedBooking({
      hostToken: host.accessToken,
      attendeeToken: att.accessToken,
      startsInHours: 72,
      priceCents: 2000,
    });
    const first = (await cancel(bookingId, att.accessToken)).json();
    const second = (await cancel(bookingId, att.accessToken)).json();
    expect(second.refundCents).toBe(first.refundCents);
    expect(second.refundStatus).toBe('full');
    expect(fakePayments.refunded.length).toBe(1); // only ONE Stripe refund
  });

  it('a non-owner cannot cancel someone else’s booking → 403', async () => {
    const host = await signIn('host@c.com');
    const att = await signIn('att@c.com');
    const intruder = await signIn('intruder@c.com');
    const { bookingId } = await confirmedBooking({
      hostToken: host.accessToken,
      attendeeToken: att.accessToken,
      startsInHours: 72,
      priceCents: 2000,
    });
    const res = await cancel(bookingId, intruder.accessToken);
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('not_owner');
  });
});

// ── host cancel fan-out ──────────────────────────────────────────────────────
describe('host event-cancel', () => {
  async function eventWithTwoAttendees(hostToken: string, startsInHours: number) {
    const a1 = await signIn('h1@c.com');
    const a2 = await signIn('h2@c.com');
    const first = await confirmedBooking({
      hostToken,
      attendeeToken: a1.accessToken,
      startsInHours,
      priceCents: 2000,
      seats: 5,
    });
    // second attendee on the SAME event
    const booked = await app.inject({
      method: 'POST',
      url: `/events/${first.eventId}/book`,
      headers: auth(a2.accessToken),
      payload: { seatCount: 1 },
    });
    const b2Id = (booked.json() as { bookingId: string }).bookingId;
    const [b2] = await db.select().from(bookings).where(eq(bookings.id, b2Id));
    await app.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: { type: 'payment_intent.succeeded', paymentIntentId: b2!.stripePiId },
    });
    return { eventId: first.eventId };
  }

  it('host cancels <24h → all refunded full + €1 credit each + warn', async () => {
    const host = await signIn('host@c.com');
    const { eventId } = await eventWithTwoAttendees(host.accessToken, 12);
    const res = await app.inject({
      method: 'POST',
      url: `/events/${eventId}/cancel`,
      headers: auth(host.accessToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.penalty).toBe('lt24h');
    expect(body.refundedCount).toBe(2);
    expect(fakePayments.refunded.length).toBe(2);
    const rows = await db.select().from(bookings).where(eq(bookings.eventId, eventId));
    expect(rows.every((r) => r.status === 'cancelled' && r.refundStatus === 'full')).toBe(true);
    expect(rows.every((r) => r.creditIssuedCents === ECONOMICS.cancellation.hostCancelPenalty.lt24h.creditCentsEach)).toBe(true);
    expect(rows.every((r) => r.creditIssuedCents === 100)).toBe(true);
    expect(fakeEvents.warnings.length).toBe(1);
    expect(fakeEvents.warnings[0]!.notice).toBe('lt24h');
  });

  it('host cancels >24h → all refunded full, no credit, warn', async () => {
    const host = await signIn('host@c.com');
    const { eventId } = await eventWithTwoAttendees(host.accessToken, 48);
    const body = (
      await app.inject({ method: 'POST', url: `/events/${eventId}/cancel`, headers: auth(host.accessToken) })
    ).json();
    expect(body.penalty).toBe('gt24h');
    expect(body.refundedCount).toBe(2);
    const rows = await db.select().from(bookings).where(eq(bookings.eventId, eventId));
    expect(rows.every((r) => r.creditIssuedCents === 0)).toBe(true);
    expect(fakeEvents.warnings[0]!.notice).toBe('gt24h');
    expect(fakeEvents.suspendSignals.length).toBe(0);
  });

  it('host no-show (event passed) → full refund all + suspend signal', async () => {
    const host = await signIn('host@c.com');
    const { eventId } = await eventWithTwoAttendees(host.accessToken, -2);
    const body = (
      await app.inject({ method: 'POST', url: `/events/${eventId}/cancel`, headers: auth(host.accessToken) })
    ).json();
    expect(body.penalty).toBe('noShow');
    expect(body.hostSuspendSignalled).toBe(true);
    expect(fakeEvents.suspendSignals.length).toBe(1);
    expect(fakeEvents.suspendSignals[0]!.hostUserId).toBe(host.user.id);
    expect(fakeEvents.warnings.length).toBe(0);
  });

  it('a non-host cannot cancel an event → 403', async () => {
    const host = await signIn('host@c.com');
    const att = await signIn('att@c.com');
    const { eventId } = await confirmedBooking({
      hostToken: host.accessToken,
      attendeeToken: att.accessToken,
      startsInHours: 72,
      priceCents: 2000,
    });
    const res = await app.inject({
      method: 'POST',
      url: `/events/${eventId}/cancel`,
      headers: auth(att.accessToken),
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('not_host');
  });
});

// ── host/admin single-booking refund ─────────────────────────────────────────
describe('host/admin booking refund', () => {
  it('host full-refunds one booking; non-host gets 403', async () => {
    const host = await signIn('host@c.com');
    const att = await signIn('att@c.com');
    const { bookingId } = await confirmedBooking({
      hostToken: host.accessToken,
      attendeeToken: att.accessToken,
      startsInHours: 10,
      priceCents: 2500,
    });
    // wrong role (the attendee) → 403
    const bad = await app.inject({
      method: 'POST',
      url: `/bookings/${bookingId}/refund`,
      headers: auth(att.accessToken),
    });
    expect(bad.statusCode).toBe(403);

    // host → full refund
    const ok = await app.inject({
      method: 'POST',
      url: `/bookings/${bookingId}/refund`,
      headers: auth(host.accessToken),
    });
    expect(ok.statusCode).toBe(200);
    const body = ok.json();
    expect(body.refundStatus).toBe('full');
    expect(body.refundCents).toBe(2500);
    expect(fakePayments.refunded.length).toBe(1);
  });
});

// ── cancel-quote (read-only, promise-delivery) ───────────────────────────────
describe('cancel-quote', () => {
  it('quote matches what cancel() then does', async () => {
    const host = await signIn('host@c.com');
    const att = await signIn('att@c.com');
    const { bookingId } = await confirmedBooking({
      hostToken: host.accessToken,
      attendeeToken: att.accessToken,
      startsInHours: 2, // inside cutoff → credit path
      priceCents: 2000,
    });
    const quote = (
      await app.inject({
        method: 'GET',
        url: `/bookings/${bookingId}/cancel-quote`,
        headers: auth(att.accessToken),
      })
    ).json();
    const done = (await cancel(bookingId, att.accessToken)).json();
    expect(quote.refundCents).toBe(done.refundCents);
    expect(quote.creditCents).toBe(done.creditCents);
    expect(quote.depositForfeited).toBe(done.depositForfeited);
    expect(quote.refundStatus).toBe(done.refundStatus);
    expect(quote.cutoffHours).toBe(ECONOMICS.cancellation.cancellationCutoffHours);
  });

  it('quote does NOT mutate the booking', async () => {
    const host = await signIn('host@c.com');
    const att = await signIn('att@c.com');
    const { bookingId } = await confirmedBooking({
      hostToken: host.accessToken,
      attendeeToken: att.accessToken,
      startsInHours: 72,
      priceCents: 2000,
    });
    const res = await app.inject({
      method: 'GET',
      url: `/bookings/${bookingId}/cancel-quote`,
      headers: auth(att.accessToken),
    });
    expect(res.statusCode).toBe(200);
    const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    expect(b!.status).toBe('confirmed');
    expect(b!.refundStatus).toBe('none');
    expect(b!.cancelledAt).toBeNull();
    expect(fakePayments.refunded.length).toBe(0);
  });
});
