import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { db, pool, bookings, circles, capsules } from '@incircleme/db';
import { buildApp } from '../src/app';
import { redis } from '../src/lib/redis';
import { FakePayments } from '../src/lib/payments';
import type { Mailer } from '../src/lib/mailer';
import type { PhotoStorage } from '../src/lib/storage';
import { capsuleGenerationTick, chatPhotoExpiryTick } from '../src/jobs/handlers';

const magicLinks: Record<string, string> = {};
const testMailer: Mailer = {
  async sendMagicLink({ to, link }) {
    magicLinks[to] = link;
  },
  async sendBookingConfirmation() {},
};
let photoSeq = 0;
const memStorage: PhotoStorage = {
  async save() {
    return `/uploads/cap-${photoSeq++}.jpg`;
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
    sql`truncate table capsule_items, capsules, notifications, circle_keep_votes, arriving_moments, circle_messages, circle_members, circles, bookings, events, sessions, magic_link_tokens, oauth_accounts, users restart identity cascade`,
  );
  for (const k of Object.keys(magicLinks)) delete magicLinks[k];
  photoSeq = 0;
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

function multipartBody(state: string) {
  const boundary = '----capsuleboundary';
  const payload = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="state"\r\n\r\n${state}\r\n--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="m.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
    ),
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return { payload, headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } };
}

/** Host + marta(confirmed). Marta shares both arriving shots; host shares only 'before'. */
async function setupEndedEvent() {
  const host = await signIn('host@test.com');
  const ev = (
    await app.inject({
      method: 'POST',
      url: '/events',
      headers: auth(host.accessToken),
      payload: {
        title: 'Pottery Sunday',
        category: 'art_craft',
        neighbourhood: 'Gràcia',
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 7_200_000).toISOString(),
        seatCount: 6,
        priceCents: 1000,
      },
    })
  ).json();
  const marta = await signIn('marta@test.com');
  const booked = await app.inject({
    method: 'POST',
    url: `/events/${ev.id}/book`,
    headers: auth(marta.accessToken),
    payload: { seatCount: 1 },
  });
  const [b] = await db.select().from(bookings).where(eq(bookings.id, booked.json().bookingId));
  await app.inject({
    method: 'POST',
    url: '/webhooks/stripe',
    payload: { type: 'payment_intent.succeeded', paymentIntentId: b!.stripePiId },
  });
  // photos: marta both states, host before only; one chat photo from marta
  for (const [who, state] of [
    [marta, 'before'],
    [marta, 'after'],
    [host, 'before'],
  ] as const) {
    const { payload, headers } = multipartBody(state);
    await app.inject({
      method: 'POST',
      url: `/events/${ev.id}/arriving`,
      headers: { ...auth(who.accessToken), ...headers },
      payload,
    });
  }
  const [circle] = await db.select().from(circles);
  await app.inject({
    method: 'POST',
    url: `/circles/${circle!.id}/messages`,
    headers: auth(marta.accessToken),
    payload: { body: 'mira', attachments: [{ type: 'photo', url: '/uploads/chat-pic.jpg' }] },
  });
  // event ended 13h ago → inside the generation window
  await db.execute(
    sql`update events set starts_at = now() - interval '14 hours', ends_at = now() - interval '13 hours' where id = ${ev.id}`,
  );
  return { host, marta, ev, circle: circle! };
}

describe('capsule generation', () => {
  it('T+12h tick generates once: pairs only for both-shot members, full roll, stats', async () => {
    const { host, marta, circle } = await setupEndedEvent();

    expect(await capsuleGenerationTick(new Date())).toBe(1);
    expect(await capsuleGenerationTick(new Date())).toBe(0); // idempotent

    const res = await app.inject({
      method: 'GET',
      url: `/circles/${circle.id}/capsule`,
      headers: auth(marta.accessToken),
    });
    expect(res.statusCode).toBe(200);
    const cap = res.json();
    // silent, not stigmatised: only marta has a pair; host (before-only) is absent
    expect(cap.differencePairs.length).toBe(1);
    expect(cap.differencePairs[0].userId).toBe(marta.user.id);
    expect(cap.differencePairs[0].beforeUrl).toBeTruthy();
    expect(cap.differencePairs[0].afterUrl).toBeTruthy();
    expect(
      cap.differencePairs.some((p: { userId: string }) => p.userId === host.user.id),
    ).toBe(false);
    // roll: 3 arriving photos only (chat photos are excluded — no consent for permanent storage).
    // Chat photo attachments are stripped at T+48h; including them before the strip would
    // persist attendee faces without consent (GDPR + Spain LO 1/1982).
    expect(cap.photos.length).toBe(3);
    expect(cap.stats.members).toBe(2);
    expect(cap.stats.sharedBoth).toBe(1);
    expect(cap.stats.messages).toBe(1);
    expect(cap.quotes).toEqual([]); // wired, empty until Slice 6
    // Active Circle members exposed for the "Your Circle" avatar strip.
    expect(cap.members).toHaveLength(2);
    expect('avatarUrl' in cap.members[0]).toBe(true);
    expect(cap.heroPhotoUrl).toBe(cap.differencePairs[0].afterUrl);
    expect(cap.eventTitle).toBe('Pottery Sunday');
  });

  it('capsule is Circle-only: non-member 403; 404 before generation', async () => {
    const { marta, circle } = await setupEndedEvent();
    const pre = await app.inject({
      method: 'GET',
      url: `/circles/${circle.id}/capsule`,
      headers: auth(marta.accessToken),
    });
    expect(pre.statusCode).toBe(404);
    await capsuleGenerationTick(new Date());
    const stranger = await signIn('out@test.com');
    const denied = await app.inject({
      method: 'GET',
      url: `/circles/${circle.id}/capsule`,
      headers: auth(stranger.accessToken),
    });
    expect(denied.statusCode).toBe(403);
  });

  it('chat photo attachments are NOT in the capsule roll (consent/GDPR fix)', async () => {
    // Chat photos sent in the Circle are never snapshotted into the capsule.
    // They are stripped at T+48h (chatPhotoExpiryTick). Including them at T+12h
    // would persist attendee faces permanently without consent.
    const { marta, circle } = await setupEndedEvent();
    await capsuleGenerationTick(new Date());
    // age the chat message past 48h and run the strip
    await db.execute(sql`update circle_messages set created_at = now() - interval '3 days'`);
    expect(await chatPhotoExpiryTick(new Date())).toBe(1);
    const cap = (
      await app.inject({
        method: 'GET',
        url: `/circles/${circle.id}/capsule`,
        headers: auth(marta.accessToken),
      })
    ).json();
    // The chat photo URL must NOT appear in the capsule roll.
    expect(cap.photos.some((p: { url: string }) => p.url === '/uploads/chat-pic.jpg')).toBe(false);
    // Only arriving-moment photos (3) are present.
    expect(cap.photos.length).toBe(3);
  });

  it('notifies members capsule_ready once', async () => {
    const { marta } = await setupEndedEvent();
    await capsuleGenerationTick(new Date());
    await capsuleGenerationTick(new Date());
    const rows = await db.execute(
      sql`select count(*)::int as n from notifications where type = 'capsule_ready' and user_id = ${marta.user.id}`,
    );
    expect((rows.rows[0] as { n: number }).n).toBe(1);
  });

  it('no circle (no confirmed bookings) → nothing generated', async () => {
    const host = await signIn('host@test.com');
    await app.inject({
      method: 'POST',
      url: '/events',
      headers: auth(host.accessToken),
      payload: {
        title: 'Empty room',
        category: 'wellness',
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 7_200_000).toISOString(),
        seatCount: 4,
        priceCents: 0,
      },
    });
    await db.execute(sql`update events set ends_at = now() - interval '2 days'`);
    expect(await capsuleGenerationTick(new Date())).toBe(0);
    expect((await db.select().from(capsules)).length).toBe(0);
  });
});
