export type ProgramStatus =
  | 'draft'
  | 'submitted'
  | 'pending_review'
  | 'verified'
  | 'under_review'
  | 'rejected';

export type CredentialKind = 'diploma' | 'license' | 'accreditation' | 'reference_letter';

/** Tier assigned on verification — gold IncircleMe seal vs forest governing-body link. */
export type VerificationTier = 'verified' | 'accredited';

export interface CurriculumWeek {
  week: number;
  title: string;
  /** Optional per-week prose (creator-entered at submission). */
  description?: string;
  skills?: string[];
  hours?: number;
}

export interface ProgramReference {
  name: string;
  role?: string;
  contact?: string;
}

export interface ProgramCredentialDTO {
  id: string;
  fileKind: CredentialKind;
  fileUrl: string;
  notes: string | null;
  verifiedAt: string | null;
}

export interface Program {
  id: string;
  hostUserId: string;
  title: string;
  description: string | null;
  language: 'ca' | 'es' | 'en';
  curriculum: CurriculumWeek[];
  timeFrameSessions: number | null;
  timeFrameTotalHours: number | null;
  assessmentMethod: string | null;
  accreditationBody: string | null;
  accreditationId: string | null;
  references: ProgramReference[];
  status: ProgramStatus;
  submissionFeeCents: number;
  credentials: ProgramCredentialDTO[];
  submittedAt: string | null;
  verifiedAt: string | null;
  verifiedTier: VerificationTier | null;
  governingBodyUrl: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

// --- Trust review (Part 2) ---

/** Queue row — submission summary for the reviewer list. */
export interface ReviewQueueItem {
  id: string;
  title: string;
  status: ProgramStatus;
  hostName: string;
  hostTier: string;
  submittedAt: string | null;
  accreditationBody: string | null;
  credentialCount: number;
}

/** Full submission detail for the reviewer (program + host + everything uploaded). */
export interface ReviewDetail extends Program {
  hostName: string;
  hostTier: string;
  hostTrustTier: string;
  reviewNotes: string | null;
}

export interface VerifyProgramRequest {
  tier: VerificationTier;
  /** Required when tier === 'accredited'. */
  governingBodyUrl?: string;
  /** The 4 gate confirmations (gate id → checked). */
  gateChecks?: Record<string, boolean>;
  notes?: string;
}

export interface RejectProgramRequest {
  reason: string;
}

/** Public-facing curated testimonial. */
export interface ProgramVoice {
  id: string;
  quote: string;
  attribution: string;
  cohortLabel: string | null;
}

/** Public-facing Q&A pair (read-only in Part 2). */
export interface ProgramQuestion {
  id: string;
  askerName: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  askedAt: string;
}

/** Public Program listing card. */
export interface PublicProgramCard {
  id: string;
  title: string;
  hostName: string;
  neighbourhood: string | null;
  timeFrameSessions: number | null;
  verifiedTier: VerificationTier;
}

/** Public Program detail — the rich screen. */
export interface PublicProgramDetail {
  id: string;
  title: string;
  description: string | null;
  hostName: string;
  hostAvatarUrl: string | null;
  hostJoinedAt: string | null;
  hostEventsHosted: number;
  neighbourhood: string | null;
  timeFrameSessions: number | null;
  timeFrameTotalHours: number | null;
  assessmentMethod: string | null;
  curriculum: CurriculumWeek[];
  verifiedTier: VerificationTier;
  governingBodyUrl: string | null;
  // NB: Programs have no price column yet (enrollment economics, deferred). The
  // public "schedule" line renders sessions · hours; a price line waits for that.
  voices: ProgramVoice[];
  questions: ProgramQuestion[];
}

export interface CreateProgramRequest {
  title: string;
  description?: string;
  language?: 'ca' | 'es' | 'en';
  curriculum?: CurriculumWeek[];
  timeFrameSessions?: number;
  timeFrameTotalHours?: number;
  assessmentMethod?: string;
  accreditationBody?: string;
  accreditationId?: string;
  references?: ProgramReference[];
}

export type UpdateProgramRequest = Partial<CreateProgramRequest>;

export interface SubmitProgramResult {
  status: ProgramStatus;
  /** Present only when the €150 fee applies (no free credit used). Confirm via Stripe. */
  clientSecret?: string;
  feeCents: number;
  usedFreeCredit: boolean;
}
