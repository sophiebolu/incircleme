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
  reviewQueueStatuses,
  tierRequiresGoverningBody,
} from '@incircleme/config';
import type { Payments } from '../../lib/payments';
import { toProgram, ProgramNotFoundError, InvalidStateError } from './programs';

/** Tier requires a governing-body link but none was supplied. */
export class GoverningBodyRequiredError extends Error {
  constructor() {
    super('governing_body_required');
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
  await db
    .update(programs)
    .set({
      status: 'verified',
      verifiedTier: tier,
      governingBodyUrl: req.governingBodyUrl?.trim() ?? null,
      verifiedBy: reviewerId,
      verifiedAt: new Date(),
      reviewNotes: req.notes ?? null,
    })
    .where(eq(programs.id, programId));
  return getReviewDetail(programId);
}

/** Not approved → refund the €150 fee (if applicable) and record the reason. */
export async function rejectProgram(
  programId: string,
  reviewerId: string,
  reason: string,
  payments: Payments,
): Promise<ReviewDetail> {
  // Lock the row for the duration so two concurrent rejections can't both refund.
  // We re-read status + feeRefunded under the lock, refund at most once (with a
  // Stripe idempotency key as a second guard), then flip feeRefunded in the same tx.
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(programs)
      .where(and(eq(programs.id, programId), isNull(programs.deletedAt)))
      .limit(1)
      .for('update');
    if (!row) throw new ProgramNotFoundError();
    if (!REVIEWABLE.includes(row.status)) throw new InvalidStateError();

    const shouldRefund =
      isSubmissionFeeRefundable() && !!row.stripePiId && !row.feeRefunded;
    if (shouldRefund && row.stripePiId) {
      await payments.refund(row.stripePiId, `program-refund-${row.stripePiId}`);
    }
    await tx
      .update(programs)
      .set({
        status: 'rejected',
        rejectionReason: reason,
        verifiedBy: reviewerId,
        feeRefunded: shouldRefund ? true : row.feeRefunded,
      })
      .where(eq(programs.id, programId));
  });
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
    .set({ status: 'under_review', verifiedBy: reviewerId })
    .where(eq(programs.id, programId));
  return getReviewDetail(programId);
}
