import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { db, pool, programs, users } from '@incircleme/db';
import { ECONOMICS } from '@incircleme/config';
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
    sql`truncate table program_credentials, programs, sessions, magic_link_tokens, oauth_accounts, users restart identity cascade`,
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

async function makePremium(userId: string, credits = 0) {
  await db.update(users).set({ hostTier: 'premium', freeProgramCredits: credits }).where(eq(users.id, userId));
}

function draft(token: string, overrides: Record<string, unknown> = {}) {
  return app.inject({
    method: 'POST',
    url: '/me/programs',
    headers: auth(token),
    payload: { title: 'Hands in Clay', accreditationBody: 'Self-taught', ...overrides },
  });
}

describe('program submission gate (config-driven)', () => {
  it('basic/pro hosts cannot submit (403 not_premium)', async () => {
    const host = await signIn('basic@test.com'); // default tier = basic
    const p = (await draft(host.accessToken)).json();
    expect(p.submissionFeeCents).toBe(ECONOMICS.programSubmission.feeCents); // reads config

    const res = await app.inject({
      method: 'POST',
      url: `/me/programs/${p.id}/submit`,
      headers: auth(host.accessToken),
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('not_premium');
  });

  it('premium without free credit → €150 PI; webhook flips to pending_review', async () => {
    const host = await signIn('prem@test.com');
    await makePremium(host.user.id, 0);
    const p = (await draft(host.accessToken)).json();

    const submit = await app.inject({
      method: 'POST',
      url: `/me/programs/${p.id}/submit`,
      headers: auth(host.accessToken),
    });
    const result = submit.json();
    expect(result.status).toBe('submitted');
    expect(result.usedFreeCredit).toBe(false);
    expect(result.feeCents).toBe(ECONOMICS.programSubmission.feeCents);
    expect(result.clientSecret).toContain('_secret_test');

    const [row] = await db.select().from(programs).where(eq(programs.id, p.id));
    expect(row!.status).toBe('submitted');

    await app.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: { type: 'payment_intent.succeeded', paymentIntentId: row!.stripePiId },
    });
    const after = (
      await app.inject({ method: 'GET', url: `/me/programs/${p.id}`, headers: auth(host.accessToken) })
    ).json();
    expect(after.status).toBe('pending_review');
  });

  it('premium WITH free credit → straight to pending_review, no fee, credit decremented', async () => {
    const host = await signIn('prem2@test.com');
    await makePremium(host.user.id, 1);
    const p = (await draft(host.accessToken)).json();

    const result = (
      await app.inject({
        method: 'POST',
        url: `/me/programs/${p.id}/submit`,
        headers: auth(host.accessToken),
      })
    ).json();
    expect(result.status).toBe('pending_review');
    expect(result.usedFreeCredit).toBe(true);
    expect(result.feeCents).toBe(0);
    expect(result.clientSecret).toBeUndefined();

    const [u] = await db.select().from(users).where(eq(users.id, host.user.id));
    expect(u!.freeProgramCredits).toBe(0);
    const [row] = await db.select().from(programs).where(eq(programs.id, p.id));
    expect(row!.status).toBe('pending_review');
    expect(row!.stripePiId).toBeNull();
  });
});

describe('program drafts', () => {
  it('edits while draft; blocks edits once submitted (409)', async () => {
    const host = await signIn('prem@test.com');
    await makePremium(host.user.id, 1);
    const p = (await draft(host.accessToken)).json();

    const edit = await app.inject({
      method: 'PATCH',
      url: `/me/programs/${p.id}`,
      headers: auth(host.accessToken),
      payload: { title: 'Hands in Clay — v2', curriculum: [{ week: 1, title: 'Wedging' }] },
    });
    expect(edit.statusCode).toBe(200);
    expect(edit.json().title).toBe('Hands in Clay — v2');
    expect(edit.json().curriculum.length).toBe(1);

    await app.inject({
      method: 'POST',
      url: `/me/programs/${p.id}/submit`,
      headers: auth(host.accessToken),
    });
    const blocked = await app.inject({
      method: 'PATCH',
      url: `/me/programs/${p.id}`,
      headers: auth(host.accessToken),
      payload: { title: 'too late' },
    });
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json().error).toBe('invalid_state');
  });

  it('owner-only: other host 403, unknown id 404', async () => {
    const host = await signIn('owner@test.com');
    const p = (await draft(host.accessToken)).json();
    const other = await signIn('other@test.com');

    const denied = await app.inject({
      method: 'GET',
      url: `/me/programs/${p.id}`,
      headers: auth(other.accessToken),
    });
    expect(denied.statusCode).toBe(403);

    const missing = await app.inject({
      method: 'GET',
      url: `/me/programs/00000000-0000-0000-0000-000000000000`,
      headers: auth(host.accessToken),
    });
    expect(missing.statusCode).toBe(404);
  });

  it('uploads a credential (multipart)', async () => {
    const host = await signIn('cred@test.com');
    const p = (await draft(host.accessToken)).json();
    const boundary = '----progboundary';
    const payload = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="fileKind"\r\n\r\ndiploma\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="d.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
      ),
      Buffer.from('%PDF-1.4 fake'),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const res = await app.inject({
      method: 'POST',
      url: `/me/programs/${p.id}/credentials`,
      headers: { ...auth(host.accessToken), 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload,
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().credentials.length).toBe(1);
    expect(res.json().credentials[0].fileKind).toBe('diploma');
  });
});
