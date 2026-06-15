export type ProgramStatus =
  | 'draft'
  | 'submitted'
  | 'pending_review'
  | 'verified'
  | 'under_review'
  | 'rejected';

export type CredentialKind = 'diploma' | 'license' | 'accreditation' | 'reference_letter';

export interface CurriculumWeek {
  week: number;
  title: string;
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
  rejectionReason: string | null;
  createdAt: string;
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
