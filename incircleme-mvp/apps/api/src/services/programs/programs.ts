import { db, programs, programCredentials, users } from '@incircleme/db';
import type { ProgramRow } from '@incircleme/db';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type {
  CreateProgramRequest,
  CredentialKind,
  CurriculumWeek,
  HostTier,
  Program,
  ProgramCredentialDTO,
  ProgramReference,
  ProgramStatus,
  SubmitProgramResult,
  UpdateProgramRequest,
} from '@incircleme/types';
import { canTierSubmitProgram, programSubmissionFeeCents } from '@incircleme/config';
import type { Payments } from '../../lib/payments';
import type { PhotoStorage } from '../../lib/storage';

const EDITABLE: ProgramStatus[] = ['draft', 'rejected'];

// When a previously-rejected program is edited or re-submitted it re-enters the
// queue clean — every artifact of the prior trust decision is wiped, including
// feeRefunded so a fresh fee can be charged and (if needed) refunded again.
const CLEARED_TRUST_FIELDS = {
  verifiedTier: null,
  governingBodyUrl: null,
  rejectionReason: null,
  reviewNotes: null,
  gateChecks: null,
  verifiedBy: null,
  reviewedBy: null,
  verifiedAt: null,
  feeRefunded: false,
} satisfies Partial<ProgramRow>;

export class NotPremiumError extends Error {
  constructor() {
    super('not_premium');
  }
}
export class InvalidStateError extends Error {
  constructor() {
    super('invalid_state');
  }
}
export class NotOwnerError extends Error {
  constructor() {
    super('not_owner');
  }
}
export class ProgramNotFoundError extends Error {
  constructor() {
    super('not_found');
  }
}

export async function toProgram(row: ProgramRow): Promise<Program> {
  const creds = await db
    .select()
    .from(programCredentials)
    .where(eq(programCredentials.programId, row.id));
  return {
    id: row.id,
    hostUserId: row.hostUserId,
    title: row.title,
    description: row.description,
    language: row.language as Program['language'],
    curriculum: (row.curriculum as CurriculumWeek[] | null) ?? [],
    timeFrameSessions: row.timeFrameSessions,
    timeFrameTotalHours: row.timeFrameTotalHours !== null ? Number(row.timeFrameTotalHours) : null,
    assessmentMethod: row.assessmentMethod,
    accreditationBody: row.accreditationBody,
    accreditationId: row.accreditationId,
    references: (row.references as ProgramReference[] | null) ?? [],
    status: row.status as ProgramStatus,
    submissionFeeCents: row.submissionFeeCents,
    credentials: creds.map(
      (c): ProgramCredentialDTO => ({
        id: c.id,
        fileKind: c.fileKind as CredentialKind,
        fileUrl: c.fileUrl,
        notes: c.notes,
        verifiedAt: c.verifiedAt ? c.verifiedAt.toISOString() : null,
      }),
    ),
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    verifiedAt: row.verifiedAt ? row.verifiedAt.toISOString() : null,
    verifiedTier: (row.verifiedTier as Program['verifiedTier']) ?? null,
    governingBodyUrl: row.governingBodyUrl,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt.toISOString(),
  };
}

async function ownOrThrow(programId: string, userId: string): Promise<ProgramRow> {
  const [row] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.id, programId), isNull(programs.deletedAt)))
    .limit(1);
  if (!row) throw new ProgramNotFoundError();
  if (row.hostUserId !== userId) throw new NotOwnerError();
  return row;
}

export async function createDraft(
  hostUserId: string,
  input: CreateProgramRequest,
): Promise<Program> {
  const [row] = await db
    .insert(programs)
    .values({
      hostUserId,
      title: input.title,
      description: input.description ?? null,
      language: input.language ?? 'ca',
      curriculum: input.curriculum ?? [],
      timeFrameSessions: input.timeFrameSessions ?? null,
      timeFrameTotalHours:
        input.timeFrameTotalHours != null ? String(input.timeFrameTotalHours) : null,
      assessmentMethod: input.assessmentMethod ?? null,
      accreditationBody: input.accreditationBody ?? null,
      accreditationId: input.accreditationId ?? null,
      references: input.references ?? [],
      submissionFeeCents: programSubmissionFeeCents(), // from the economics config
    })
    .returning();
  return toProgram(row!);
}

export async function listMyPrograms(userId: string): Promise<Program[]> {
  const rows = await db
    .select()
    .from(programs)
    .where(and(eq(programs.hostUserId, userId), isNull(programs.deletedAt)))
    .orderBy(desc(programs.createdAt));
  return Promise.all(rows.map(toProgram));
}

export async function getMyProgram(programId: string, userId: string): Promise<Program> {
  return toProgram(await ownOrThrow(programId, userId));
}

export async function updateDraft(
  programId: string,
  userId: string,
  input: UpdateProgramRequest,
): Promise<Program> {
  const row = await ownOrThrow(programId, userId);
  if (!EDITABLE.includes(row.status as ProgramStatus)) throw new InvalidStateError();
  const set: Partial<ProgramRow> = {};
  if (input.title !== undefined) set.title = input.title;
  if (input.description !== undefined) set.description = input.description;
  if (input.language !== undefined) set.language = input.language;
  if (input.curriculum !== undefined) set.curriculum = input.curriculum;
  if (input.timeFrameSessions !== undefined) set.timeFrameSessions = input.timeFrameSessions;
  if (input.timeFrameTotalHours !== undefined)
    set.timeFrameTotalHours = String(input.timeFrameTotalHours);
  if (input.assessmentMethod !== undefined) set.assessmentMethod = input.assessmentMethod;
  if (input.accreditationBody !== undefined) set.accreditationBody = input.accreditationBody;
  if (input.accreditationId !== undefined) set.accreditationId = input.accreditationId;
  if (input.references !== undefined) set.references = input.references;
  // Editing a rejected program clears the stale rejection/verdict so it's clean for re-review.
  if (row.status === 'rejected') Object.assign(set, CLEARED_TRUST_FIELDS);
  const [updated] = await db
    .update(programs)
    .set(set)
    .where(eq(programs.id, programId))
    .returning();
  return toProgram(updated!);
}

export async function addCredential(
  programId: string,
  userId: string,
  fileKind: CredentialKind,
  file: Buffer,
  ext: string,
  storage: PhotoStorage,
): Promise<Program> {
  const row = await ownOrThrow(programId, userId);
  if (!EDITABLE.includes(row.status as ProgramStatus)) throw new InvalidStateError();
  const fileUrl = await storage.save(file, ext);
  await db.insert(programCredentials).values({ programId, fileUrl, fileKind });
  return toProgram(row);
}

/**
 * Premium-gated submission. Reads tier/fee/credit from @incircleme/config.
 * Free credit → straight to the Trust queue (pending_review); otherwise a €150
 * PaymentIntent holds at `submitted` until the webhook confirms it.
 */
export async function submitProgram(
  programId: string,
  userId: string,
  payments: Payments,
): Promise<SubmitProgramResult> {
  const row = await ownOrThrow(programId, userId);
  if (!EDITABLE.includes(row.status as ProgramStatus)) throw new InvalidStateError();

  const [host] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!host || !canTierSubmitProgram(host.hostTier as HostTier)) throw new NotPremiumError();

  // Re-submitting a rejected program wipes the prior trust verdict (see CLEARED_TRUST_FIELDS).
  const clearTrust = row.status === 'rejected' ? CLEARED_TRUST_FIELDS : {};

  // Free-credit path (atomic): consume a credit, go straight to review.
  const usedFreeCredit = await db.transaction(async (tx) => {
    const [u] = await tx.select().from(users).where(eq(users.id, userId)).for('update').limit(1);
    if (u && u.freeProgramCredits > 0) {
      await tx
        .update(users)
        .set({ freeProgramCredits: u.freeProgramCredits - 1 })
        .where(eq(users.id, userId));
      await tx
        .update(programs)
        .set({ ...clearTrust, status: 'pending_review', submittedAt: new Date(), stripePiId: null })
        .where(eq(programs.id, programId));
      return true;
    }
    return false;
  });
  if (usedFreeCredit) {
    return { status: 'pending_review', feeCents: 0, usedFreeCredit: true };
  }

  // Fee path — €150 PI; webhook flips `submitted` → `pending_review` on success.
  const feeCents = programSubmissionFeeCents();
  const pi = await payments.createPaymentIntent({
    amountCents: feeCents,
    currency: 'EUR',
    metadata: { kind: 'program_submission', programId, userId },
  });
  await db
    .update(programs)
    .set({
      ...clearTrust,
      status: 'submitted',
      submittedAt: new Date(),
      stripePiId: pi.id,
      submissionFeeCents: feeCents,
    })
    .where(eq(programs.id, programId));
  return { status: 'submitted', clientSecret: pi.clientSecret, feeCents, usedFreeCredit: false };
}

/** Webhook: the €150 submission PI succeeded → pending_review (idempotent). */
export async function confirmProgramSubmission(piId: string): Promise<boolean> {
  const [row] = await db.select().from(programs).where(eq(programs.stripePiId, piId)).limit(1);
  if (!row || row.status !== 'submitted') return false;
  await db
    .update(programs)
    .set({ status: 'pending_review' })
    .where(and(eq(programs.id, row.id), eq(programs.status, 'submitted')));
  return true;
}

/**
 * Webhook: the submission PI failed → release the program back to draft so it
 * isn't stuck at `submitted` forever (idempotent). The host can edit and retry.
 */
export async function failProgramSubmission(piId: string): Promise<boolean> {
  const [row] = await db.select().from(programs).where(eq(programs.stripePiId, piId)).limit(1);
  if (!row || row.status !== 'submitted') return false;
  await db
    .update(programs)
    .set({ status: 'draft', stripePiId: null, submittedAt: null })
    .where(and(eq(programs.id, row.id), eq(programs.status, 'submitted')));
  return true;
}
