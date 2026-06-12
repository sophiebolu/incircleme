import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import {
  db,
  pool,
  bookings,
  circles,
  circleMessages,
  circleKeepVotes,
  events,
  notifications,
} from '@incircleme/db';
import { buildApp } from '../src/app';
import { redis } from '../src/lib/redis';
import { FakePayments } from '../src/lib/payments';
import type { Mailer } from '../src/lib/mailer';
import type { PhotoStorage } from '../src/lib/storage';
import {
  addressUnlockTick,
  arrivingPreTick,
  arrivingPostTick,
  chatPhotoExpiryTick,
  afterlifeEvaluateTick,
} from '../src/jobs/handlers';

const magicLinks: Record<string, string> = {};
const testMailer: Mailer = {
  async sendMagicLink({ to, link }) {
    magicLinks[to] = link;
  },
  async sendBookingConfirmation() {},
};

const saved: string[] = [];
const memStorage: PhotoStorage = {
  async save(_buf, ext) {
    const url = `/uploads/test-${saved.length}.${ext}`;
    saved.push(url);
    return url;
  },
  async remove() {},
};

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = await buildApp({
    mailer: testMailer,
    payments: new FakePayments(),
    storage: memStorage,
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
  saved.length = 0;
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

async function setupCircle(eventOverrides: Record<string, unknown> = {}) {
  const host = await signIn('host@test.com');
  const evRes = await app.inject({
    method: 'POST',
    url: '/events',
    headers: auth(host.accessToken),
    payload: {
      title: 'Sound bath',
      category: 'wellness',
      neighbourhood: 'Gràcia',
      address: 'Plaça del Sol 3',
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      endsAt: new Date(Date.now() + 90_000_000).toISOString(),
      seatCount: 6,
      priceCents: 1000,
      ...eventOverrides,
    },
  });
  const ev = evRes.json();
  const user = await signIn('marta@test.com');
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
    payload: { type: 'payment_intent.succeeded', paymentIntentId: b!.stripePiId },
  });
  const [circle] = await db.select().from(circles);
  return { host, user, ev, circle: circle! };
}

function multipartBody(state: string): { payload: Buffer; headers: Record<string, string> } {
  const boundary = '----vitestboundary';
  const parts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="state"\r\n\r\n${state}\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="m.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
  ];
  const payload = Buffer.concat([
    Buffer.from(parts.join('')),
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]), // tiny fake jpeg
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return {
    payload,
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

describe('arriving moments', () => {
  it('member uploads before+after, visible to circle, delete is owner-only', async () => {
    const { host, user, ev } = await setupCircle();

    for (const state of ['before', 'after']) {
      const { payload, headers } = multipartBody(state);
      const res = await app.inject({
        method: 'POST',
        url: `/events/${ev.id}/arriving`,
        headers: { ...auth(user.accessToken), ...headers },
        payload,
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().state).toBe(state);
    }

    const list = (
      await app.inject({
        method: 'GET',
        url: `/events/${ev.id}/arriving`,
        headers: auth(host.accessToken), // host is a member, sees them
      })
    ).json();
    expect(list.length).toBe(2);

    // stranger: 403
    const stranger = await signIn('out@test.com');
    const denied = await app.inject({
      method: 'GET',
      url: `/events/${ev.id}/arriving`,
      headers: auth(stranger.accessToken),
    });
    expect(denied.statusCode).toBe(403);

    // host can't delete marta's moment
    const wrongOwner = await app.inject({
      method: 'DELETE',
      url: `/arriving/${list[0].id}`,
      headers: auth(host.accessToken),
    });
    expect(wrongOwner.statusCode).toBe(403);

    const owner = await app.inject({
      method: 'DELETE',
      url: `/arriving/${list[0].id}`,
      headers: auth(user.accessToken),
    });
    expect(owner.statusCode).toBe(204);
    const after = (
      await app.inject({
        method: 'GET',
        url: `/events/${ev.id}/arriving`,
        headers: auth(user.accessToken),
      })
    ).json();
    expect(after.length).toBe(1);
  });
});

describe('scheduled job handlers (direct, fixed now)', () => {
  it('addressUnlockTick unlocks T-1d events and notifies attendees once (idempotent)', async () => {
    const { user, ev } = await setupCircle();
    // event starts in 23.5h relative to `now`
    const now = new Date(new Date(ev.startsAt).getTime() - 23.5 * 3600 * 1000);
    expect((await addressUnlockTick(now)) >= 1).toBe(true);
    const [e] = await db.select().from(events).where(eq(events.id, ev.id));
    expect(e!.addressLocked).toBe(false);
    const notes = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.user.id));
    expect(notes.filter((n) => n.type === 'address_unlock').length).toBe(1);
    // idempotent re-run: no second unlock, no duplicate notification
    expect(await addressUnlockTick(now)).toBe(0);
    const notes2 = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.user.id));
    expect(notes2.filter((n) => n.type === 'address_unlock').length).toBe(1);
  });

  it('arriving pre/post ticks notify confirmed attendees in their windows, once', async () => {
    const { user, ev } = await setupCircle();
    const preNow = new Date(new Date(ev.startsAt).getTime() - 6 * 3600 * 1000);
    expect(await arrivingPreTick(preNow)).toBe(1);
    expect(await arrivingPreTick(preNow)).toBe(0); // idempotent
    const postNow = new Date(new Date(ev.endsAt).getTime() - 30 * 60 * 1000);
    expect(await arrivingPostTick(postNow)).toBe(1);
    const notes = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.user.id));
    expect(notes.map((n) => n.type).sort()).toEqual(
      ['arriving_post', 'arriving_pre', 'booking_confirm'].filter((t) => t !== 'booking_confirm'),
    );
  });

  it('chatPhotoExpiryTick strips photo attachments >48h after a past event', async () => {
    const { user, circle, ev } = await setupCircle();
    await app.inject({
      method: 'POST',
      url: `/circles/${circle.id}/messages`,
      headers: auth(user.accessToken),
      payload: { body: 'look', attachments: [{ type: 'photo', url: '/uploads/x.jpg' }] },
    });
    // pretend the message is 3 days old and the event ended 2 days ago
    await db.execute(
      sql`update circle_messages set created_at = now() - interval '3 days'`,
    );
    await db.execute(sql`update events set ends_at = now() - interval '2 days' where id = ${ev.id}`);
    expect(await chatPhotoExpiryTick(new Date())).toBe(1);
    const [msg] = await db.select().from(circleMessages);
    expect(msg!.attachments).toBeNull();
    expect(msg!.body).toBe('look'); // text survives
    expect(await chatPhotoExpiryTick(new Date())).toBe(0); // idempotent
  });

  it('afterlifeEvaluateTick keeps a circle at T+7d when threshold met', async () => {
    const { user, circle, ev } = await setupCircle();
    // 4 yes votes straight into the ledger (route already tested)
    const voters = [user.user.id];
    for (const email of ['v1@t.com', 'v2@t.com', 'v3@t.com']) {
      const u = await signIn(email);
      voters.push(u.user.id);
    }
    for (const uid of voters) {
      await db.insert(circleKeepVotes).values({ circleId: circle.id, userId: uid, vote: true });
    }
    await db.execute(sql`update events set ends_at = now() - interval '8 days' where id = ${ev.id}`);
    expect(await afterlifeEvaluateTick(new Date())).toBe(1);
    const [c] = await db.select().from(circles).where(eq(circles.id, circle.id));
    expect(c!.keptAt).not.toBeNull();
    expect(await afterlifeEvaluateTick(new Date())).toBe(0); // idempotent
  });
});
