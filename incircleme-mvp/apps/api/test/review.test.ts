import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { db, pool, programs, programVoices, programQuestions, users } from '@incircleme/db';
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
let payments: FakePayments;

beforeAll(async () => {
  payments = new FakePayments();
  app = await buildApp({ mailer: testMailer, payments, realtime: false, logger: false });
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
    sql`truncate table program_voices, program_questions, program_credentials, programs, sessions, magic_link_tokens, users restart identity cascade`,
  );
  payments.refunded.length = 0;
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

const makePremium = (userId: string, credits: number) =>
  db.update(users).set({ hostTier: 'premium', freeProgramCredits: credits }).where(eq(users.id, userId));
const makeReviewer = (userId: string) =>
  db.update(users).set({ role: 'trust_reviewer' }).where(eq(users.id, userId));

/** Premium host (1 free credit) → free-credit submission → pending_review. No PI. */
async function freePending(): Promise<string> {
  const host = await signIn('host@test.com');
  await makePremium(host.user.id, 1);
  const p = (
    await app.inject({
      method: 'POST',
      url: '/me/programs',
      headers: auth(host.accessToken),
      payload: { title: 'Hands in Clay', timeFrameSessions: 6, accreditationBody: 'Self-taught' },
    })
  ).json();
  await app.inject({
    method: 'POST',
    url: `/me/programs/${p.id}/submit`,
    headers: auth(host.accessToken),
  });
  return p.id;
}

/** Premium host (no credit) → €150 fee → webhook → pending_review. Returns id + PI. */
async function feePending(): Promise<{ id: string; piId: string }> {
  const host = await signIn('feehost@test.com');
  await makePremium(host.user.id, 0);
  const p = (
    await app.inject({
      method: 'POST',
      url: '/me/programs',
      headers: auth(host.accessToken),
      payload: { title: 'Drawing from Life' },
    })
  ).json();
  await app.inject({
    method: 'POST',
    url: `/me/programs/${p.id}/submit`,
    headers: auth(host.accessToken),
  });
  const [row] = await db.select().from(programs).where(eq(programs.id, p.id));
  await app.inject({
    method: 'POST',
    url: '/webhooks/stripe',
    payload: { type: 'payment_intent.succeeded', paymentIntentId: row!.stripePiId },
  });
  return { id: p.id, piId: row!.stripePiId! };
}

async function reviewer() {
  const r = await signIn('trust@incircleme.dev');
  await makeReviewer(r.user.id);
  return r;
}

describe('Trust review — reviewer gate + queue', () => {
  it('non-reviewer cannot reach the queue (403)', async () => {
    const member = await signIn('member@test.com');
    const res = await app.inject({
      method: 'GET',
      url: '/admin/programs/queue',
      headers: auth(member.accessToken),
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('not_reviewer');
  });

  it('queue lists pending_review with submission summary', async () => {
    const pid = await freePending();
    const r = await reviewer();
    const res = await app.inject({
      method: 'GET',
      url: '/admin/programs/queue',
      headers: auth(r.accessToken),
    });
    expect(res.statusCode).toBe(200);
    const queue = res.json();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(pid);
    expect(queue[0].status).toBe('pending_review');
    expect(queue[0].hostTier).toBe('premium');
    expect(typeof queue[0].hostName).toBe('string');
  });

  it('detail returns full submission + host', async () => {
    const pid = await freePending();
    const r = await reviewer();
    const res = await app.inject({
      method: 'GET',
      url: `/admin/programs/${pid}`,
      headers: auth(r.accessToken),
    });
    const d = res.json();
    expect(d.title).toBe('Hands in Clay');
    expect(d.hostTier).toBe('premium');
    expect(d.curriculum).toBeDefined();
  });
});

// All four config gates affirmed — required for a program to be verified.
const ALL_GATES = {
  host_standing: true,
  curriculum_substance: true,
  credentials_verified: true,
  assessment_integrity: true,
};

describe('Trust review — decisions', () => {
  it('verify (verified/gold) → verified + tier + verifiedBy; leaves the queue', async () => {
    const pid = await freePending();
    const r = await reviewer();
    const res = await app.inject({
      method: 'POST',
      url: `/admin/programs/${pid}/verify`,
      headers: auth(r.accessToken),
      payload: { tier: 'verified', gateChecks: ALL_GATES },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().verifiedTier).toBe('verified');
    const [row] = await db.select().from(programs).where(eq(programs.id, pid));
    expect(row!.status).toBe('verified');
    expect(row!.verifiedBy).toBe(r.user.id);
    expect(row!.reviewedBy).toBe(r.user.id);
    expect(row!.gateChecks).toEqual(ALL_GATES);

    const queue = (
      await app.inject({ method: 'GET', url: '/admin/programs/queue', headers: auth(r.accessToken) })
    ).json();
    expect(queue).toHaveLength(0);
  });

  it('accredited without a governing-body link → 400', async () => {
    const pid = await freePending();
    const r = await reviewer();
    const res = await app.inject({
      method: 'POST',
      url: `/admin/programs/${pid}/verify`,
      headers: auth(r.accessToken),
      payload: { tier: 'accredited' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('governing_body_required');
  });

  it('accredited with a governing-body link → verified/forest', async () => {
    const pid = await freePending();
    const r = await reviewer();
    const res = await app.inject({
      method: 'POST',
      url: `/admin/programs/${pid}/verify`,
      headers: auth(r.accessToken),
      payload: {
        tier: 'accredited',
        governingBodyUrl: 'https://ceramics.example.org/cert/77',
        gateChecks: ALL_GATES,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().verifiedTier).toBe('accredited');
    expect(res.json().governingBodyUrl).toContain('ceramics.example.org');
  });

  it('reject a fee-path Program → refund the €150 PI + feeRefunded', async () => {
    const { id, piId } = await feePending();
    const r = await reviewer();
    const res = await app.inject({
      method: 'POST',
      url: `/admin/programs/${id}/reject`,
      headers: auth(r.accessToken),
      payload: { reason: 'Curriculum too thin for a credential.' },
    });
    expect(res.statusCode).toBe(200);
    expect(payments.refunded).toContain(piId);
    const [row] = await db.select().from(programs).where(eq(programs.id, id));
    expect(row!.status).toBe('rejected');
    expect(row!.feeRefunded).toBe(true);
    expect(row!.rejectionReason).toContain('too thin');
  });

  it('reject a free-credit Program → no refund (no PI), feeRefunded stays false', async () => {
    const pid = await freePending();
    const r = await reviewer();
    await app.inject({
      method: 'POST',
      url: `/admin/programs/${pid}/reject`,
      headers: auth(r.accessToken),
      payload: { reason: 'Not yet.' },
    });
    expect(payments.refunded).toHaveLength(0);
    const [row] = await db.select().from(programs).where(eq(programs.id, pid));
    expect(row!.feeRefunded).toBe(false);
  });

  it('under_review → stays in queue → can then be verified', async () => {
    const pid = await freePending();
    const r = await reviewer();
    await app.inject({
      method: 'POST',
      url: `/admin/programs/${pid}/under-review`,
      headers: auth(r.accessToken),
    });
    const queue = (
      await app.inject({ method: 'GET', url: '/admin/programs/queue', headers: auth(r.accessToken) })
    ).json();
    expect(queue[0].status).toBe('under_review');
    const verify = await app.inject({
      method: 'POST',
      url: `/admin/programs/${pid}/verify`,
      headers: auth(r.accessToken),
      payload: { tier: 'verified', gateChecks: ALL_GATES },
    });
    expect(verify.statusCode).toBe(200);
  });

  it('verify without affirming every gate → 400 gate_checks_required', async () => {
    const pid = await freePending();
    const r = await reviewer();
    const res = await app.inject({
      method: 'POST',
      url: `/admin/programs/${pid}/verify`,
      headers: auth(r.accessToken),
      payload: { tier: 'verified', gateChecks: { ...ALL_GATES, assessment_integrity: false } },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('gate_checks_required');
  });

  it('acting on a non-queue Program (draft) → 409', async () => {
    const host = await signIn('drafter@test.com');
    await makePremium(host.user.id, 1);
    const p = (
      await app.inject({
        method: 'POST',
        url: '/me/programs',
        headers: auth(host.accessToken),
        payload: { title: 'Just a draft' },
      })
    ).json();
    const r = await reviewer();
    const res = await app.inject({
      method: 'POST',
      url: `/admin/programs/${p.id}/verify`,
      headers: auth(r.accessToken),
      payload: { tier: 'verified' },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('Trust review — re-submit & failed payment', () => {
  it('editing a rejected Program wipes the stale verdict; re-submit re-queues it', async () => {
    const host = await signIn('resubmit@test.com');
    await makePremium(host.user.id, 2); // two credits: one per submission
    const p = (
      await app.inject({
        method: 'POST',
        url: '/me/programs',
        headers: auth(host.accessToken),
        payload: { title: 'Bread, Slowly' },
      })
    ).json();
    await app.inject({
      method: 'POST',
      url: `/me/programs/${p.id}/submit`,
      headers: auth(host.accessToken),
    });
    const r = await reviewer();
    await app.inject({
      method: 'POST',
      url: `/admin/programs/${p.id}/reject`,
      headers: auth(r.accessToken),
      payload: { reason: 'Needs a real assessment bar.' },
    });
    const [rejected] = await db.select().from(programs).where(eq(programs.id, p.id));
    expect(rejected!.status).toBe('rejected');
    expect(rejected!.rejectionReason).toContain('assessment');
    expect(rejected!.reviewedBy).toBe(r.user.id);

    // Host edits → stale verdict cleared, still editable (rejected).
    await app.inject({
      method: 'PATCH',
      url: `/me/programs/${p.id}`,
      headers: auth(host.accessToken),
      payload: { title: 'Bread, Slowly (v2)' },
    });
    const [edited] = await db.select().from(programs).where(eq(programs.id, p.id));
    expect(edited!.rejectionReason).toBeNull();
    expect(edited!.reviewedBy).toBeNull();
    expect(edited!.status).toBe('rejected');

    // Re-submit → back in the queue.
    await app.inject({
      method: 'POST',
      url: `/me/programs/${p.id}/submit`,
      headers: auth(host.accessToken),
    });
    const [resubmitted] = await db.select().from(programs).where(eq(programs.id, p.id));
    expect(resubmitted!.status).toBe('pending_review');
  });

  it('a failed submission payment releases a stuck Program back to draft', async () => {
    const host = await signIn('failpay@test.com');
    await makePremium(host.user.id, 0); // no credit → fee path → status submitted
    const p = (
      await app.inject({
        method: 'POST',
        url: '/me/programs',
        headers: auth(host.accessToken),
        payload: { title: 'Watercolour Mornings' },
      })
    ).json();
    await app.inject({
      method: 'POST',
      url: `/me/programs/${p.id}/submit`,
      headers: auth(host.accessToken),
    });
    const [submitted] = await db.select().from(programs).where(eq(programs.id, p.id));
    expect(submitted!.status).toBe('submitted');

    await app.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: {
        type: 'payment_intent.payment_failed',
        paymentIntentId: submitted!.stripePiId,
        kind: 'program_submission',
      },
    });
    const [released] = await db.select().from(programs).where(eq(programs.id, p.id));
    expect(released!.status).toBe('draft');
    expect(released!.stripePiId).toBeNull();
  });
});

describe('Public Programs', () => {
  it('lists only verified Programs; detail is rich (voices + Q&A)', async () => {
    const pid = await freePending();
    const r = await reviewer();
    // not verified yet → public list empty
    expect((await app.inject({ method: 'GET', url: '/programs' })).json()).toHaveLength(0);

    await app.inject({
      method: 'POST',
      url: `/admin/programs/${pid}/verify`,
      headers: auth(r.accessToken),
      payload: { tier: 'verified', gateChecks: ALL_GATES },
    });
    // seed voices + a public question
    await db.insert(programVoices).values({
      programId: pid,
      quote: 'Six Sundays later I trim foot rings.',
      attribution: 'Sofía R. · February cohort',
      position: 0,
    });
    await db.insert(programQuestions).values({
      programId: pid,
      askerName: 'Marc P.',
      question: 'Weak wrists — would the wheel be too much?',
      answer: "You'd be fine. Centring needs grip more than strength.",
      answeredAt: new Date(),
    });

    const list = (await app.inject({ method: 'GET', url: '/programs' })).json();
    expect(list).toHaveLength(1);
    expect(list[0].verifiedTier).toBe('verified');

    const detail = (await app.inject({ method: 'GET', url: `/programs/${pid}` })).json();
    expect(detail.title).toBe('Hands in Clay');
    expect(detail.voices).toHaveLength(1);
    expect(detail.questions).toHaveLength(1);
    expect(detail.questions[0].answer).toContain('grip');
  });

  it('public detail for a non-verified id → 404', async () => {
    const pid = await freePending(); // pending_review, not verified
    expect((await app.inject({ method: 'GET', url: `/programs/${pid}` })).statusCode).toBe(404);
  });
});
