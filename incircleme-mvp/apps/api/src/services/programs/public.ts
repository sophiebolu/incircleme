import { db, programs, programVoices, programQuestions, users } from '@incircleme/db';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import type {
  CurriculumWeek,
  ProgramQuestion,
  ProgramVoice,
  PublicProgramCard,
  PublicProgramDetail,
  VerificationTier,
} from '@incircleme/types';

const isVerified = and(eq(programs.status, 'verified'), isNull(programs.deletedAt));

/** Browse verified Programs (gold + forest). Public, no auth. */
export async function listPublicPrograms(): Promise<PublicProgramCard[]> {
  const rows = await db
    .select({
      id: programs.id,
      title: programs.title,
      timeFrameSessions: programs.timeFrameSessions,
      verifiedTier: programs.verifiedTier,
      hostName: users.displayName,
      neighbourhood: users.neighbourhood,
    })
    .from(programs)
    .innerJoin(users, eq(users.id, programs.hostUserId))
    .where(isVerified)
    .orderBy(desc(programs.verifiedAt));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    hostName: r.hostName ?? '—',
    neighbourhood: r.neighbourhood,
    timeFrameSessions: r.timeFrameSessions,
    verifiedTier: (r.verifiedTier ?? 'verified') as VerificationTier,
  }));
}

/** Rich public detail for one verified Program (incl. seeded voices + Q&A). */
export async function getPublicProgram(id: string): Promise<PublicProgramDetail | null> {
  const [row] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.id, id), isVerified))
    .limit(1);
  if (!row) return null;

  const [host] = await db.select().from(users).where(eq(users.id, row.hostUserId)).limit(1);

  const voiceRows = await db
    .select()
    .from(programVoices)
    .where(eq(programVoices.programId, id))
    .orderBy(asc(programVoices.position));
  const voices: ProgramVoice[] = voiceRows.map((v) => ({
    id: v.id,
    quote: v.quote,
    attribution: v.attribution,
    cohortLabel: v.cohortLabel,
  }));

  const questionRows = await db
    .select()
    .from(programQuestions)
    .where(and(eq(programQuestions.programId, id), eq(programQuestions.isPublic, true)))
    .orderBy(desc(programQuestions.askedAt));
  const questions: ProgramQuestion[] = questionRows.map((q) => ({
    id: q.id,
    askerName: q.askerName,
    question: q.question,
    answer: q.answer,
    answeredAt: q.answeredAt ? q.answeredAt.toISOString() : null,
    askedAt: q.askedAt.toISOString(),
  }));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    hostName: host?.displayName ?? '—',
    neighbourhood: host?.neighbourhood ?? null,
    timeFrameSessions: row.timeFrameSessions,
    timeFrameTotalHours: row.timeFrameTotalHours !== null ? Number(row.timeFrameTotalHours) : null,
    assessmentMethod: row.assessmentMethod,
    curriculum: (row.curriculum as CurriculumWeek[] | null) ?? [],
    verifiedTier: (row.verifiedTier ?? 'verified') as VerificationTier,
    governingBodyUrl: row.governingBodyUrl,
    voices,
    questions,
  };
}
