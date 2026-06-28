import { db, programs, programCredentials, users } from '@incircleme/db';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type {
  ReviewDetail,
  ReviewQueueItem,
  VerificationTier,
  VerifyProgramRequest,
} from '@incircleme/types';
import {
  isSubmissionFeeRefundable,
  reviewGates,
  reviewQueueStatuses,
  tierRequiresGoverningBody,
} from '@incircleme/config';
import type { FastifyBaseLogger } from 'fastify';
import type { Payments } from '../../lib/payments';
import { toProgram, ProgramNotFoundError, InvalidStateError } from './programs';

/** Tier requires a governing-body link but none was supplied. */
export class GoverningBodyRequiredError extends Error {
  constructor() {
    super('governing_body_required');
  }
}

/** Verification attempted without affirming all required review gates. */
export class GateChecksRequiredError extends Error {
  constructor() {
    super('gate_checks_required');
  }
}

const REVIEWABLE = reviewQueueStatuses();

async function reviewableOrThrow(programId: string) {
  const [row] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.id, programId), isNull(programs.deletedAt)))
    .limit(1);
  if (!row) throw new ProgramNotFoundError();
  if (!REVIEWABLE.includes(row.status)) throw new InvalidStateError();
  return row;
}

/** Programs awaiting a Trust decision (pending_review + under_review). */
export async function listReviewQueue(): Promise<ReviewQueueItem[]> {
  const rows = await db
    .select({
      id: programs.id,
      title: programs.title,
      status: programs.status,
      submittedAt: programs.submittedAt,
      accreditationBody: programs.accreditationBody,
      hostName: users.displayName,
      hostTier: users.hostTier,
      credentialCount: sql<number>`(select count(*) from ${programCredentials} where ${programCredentials.programId} = ${programs.id})`,
    })
    .from(programs)
    .innerJoin(users, eq(users.id, programs.hostUserId))
    .where(and(inArray(programs.status, REVIEWABLE), isNull(programs.deletedAt)))
    .orderBy(desc(programs.submittedAt));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status as ReviewQueueItem['status'],
    hostName: r.hostName ?? '—',
    hostTier: r.hostTier,
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
    accreditationBody: r.accreditationBody,
    credentialCount: Number(r.credentialCount),
  }));
}

/** Full submission for the reviewer — program + host + everything uploaded. */
export async function getReviewDetail(programId: string): Promise<ReviewDetail> {
  const [row] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.id, programId), isNull(programs.deletedAt)))
    .limit(1);
  if (!row) throw new ProgramNotFoundError();
  const [host] = await db.select().from(users).where(eq(users.id, row.hostUserId)).limit(1);
  const program = await toProgram(row);
  return {
    ...program,
    hostName: host?.displayName ?? '—',
    hostTier: host?.hostTier ?? 'basic',
    hostTrustTier: host?.trustTier ?? 'newcomer',
    reviewNotes: row.reviewNotes,
  };
}

/** Verify → assign a tier (gold/forest). Accredited requires a governing-body link. */
export async function verifyProgram(
  programId: string,
  reviewerId: string,
  req: VerifyProgramRequest,
): Promise<ReviewDetail> {
  await reviewableOrThrow(programId);
  const tier: VerificationTier = req.tier;
  if (tierRequiresGoverningBody(tier) && !req.governingBodyUrl?.trim()) {
    throw new GoverningBodyRequiredError();
  }
  // Every config gate must be explicitly affirmed before a program can be verified.
  const checks = req.gateChecks ?? {};
  if (!reviewGates().every((g) => checks[g.id] === true)) {
    throw new GateChecksRequiredError();
  }
  await db
    .update(programs)
    .set({
      status: 'verified',
      verifiedTier: tier,
      governingBodyUrl: req.governingBodyUrl?.trim() ?? null,
      verifiedBy: reviewerId,
      reviewedBy: reviewerId,
      verifiedAt: new Date(),
      reviewNotes: req.notes ?? null,
      gateChecks: checks, // audit trail of the affirmed gates
    })
    .where(eq(programs.id, programId));
  return getReviewDetail(programId);
}

/** Not approved → record the reason, then refund the €150 fee post-commit (if applicable). */
export async function rejectProgram(
  programId: string,
  reviewerId: string,
  reason: string,
  payments: Payments,
  logger: Pick<FastifyBaseLogger, 'error'>,
): Promise<ReviewDetail> {
  // Phase A — under the row lock, re-read status + feeRefunded and commit the rejection.
  // Only one concurrent rejection can leave the row REVIEWABLE, so at most one proceeds to a
  // refund. feeRefunded is NOT flipped here — it's set true only once the post-commit refund
  // succeeds, so a failed refund leaves it false (reconcilable) rather than falsely "refunded".
  let refundPiId: string | null = null;
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(programs)
      .where(and(eq(programs.id, programId), isNull(programs.deletedAt)))
      .limit(1)
      .for('update');
    if (!row) throw new ProgramNotFoundError();
    if (!REVIEWABLE.includes(row.status)) throw new InvalidStateError();

    if (isSubmissionFeeRefundable() && row.stripePiId && !row.feeRefunded) {
      refundPiId = row.stripePiId;
    }
    await tx
      .update(programs)
      .set({ status: 'rejected', rejectionReason: reason, reviewedBy: reviewerId })
      .where(eq(programs.id, programId));
  });

  // Phase B — move the money AFTER commit (idempotent at Stripe). Flip feeRefunded only on
  // success; a failure is logged, never thrown (the rejection is already committed).
  if (refundPiId) {
    try {
      await payments.refund(refundPiId, `program-refund-${refundPiId}`);
      await db.update(programs).set({ feeRefunded: true }).where(eq(programs.id, programId));
    } catch (err) {
      logger.error(
        { err, evt: 'program_refund_failed_post_commit', programId },
        'post-commit program-fee refund failed; rejection committed, feeRefunded left false',
      );
    }
  }
  return getReviewDetail(programId);
}

/** Park a submission as under_review (needs more from the host / a second look). */
export async function markUnderReview(
  programId: string,
  reviewerId: string,
): Promise<ReviewDetail> {
  await reviewableOrThrow(programId);
  await db
    .update(programs)
    .set({ status: 'under_review', reviewedBy: reviewerId })
    .where(eq(programs.id, programId));
  return getReviewDetail(programId);
}
