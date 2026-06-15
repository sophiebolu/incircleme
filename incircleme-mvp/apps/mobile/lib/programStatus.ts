import type { ProgramStatus } from '@incircleme/types';
import { t } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';

// Display-only mapping. DB enum values are unchanged (e.g. `rejected` → "Not approved",
// `submitted` → "Payment pending", `under_review` → "Paused"). §22.
const STATUS_KEY = {
  draft: 'prog_statusDraft',
  submitted: 'prog_statusPaymentPending',
  pending_review: 'prog_statusInReview',
  verified: 'prog_statusVerified',
  rejected: 'prog_statusNotApproved',
  under_review: 'prog_statusPaused',
} as const;

export const statusLabel = (s: ProgramStatus): string => t(STATUS_KEY[s]);

export const statusColor = (s: ProgramStatus): string => {
  switch (s) {
    case 'verified':
      return tokens.color.forest;
    case 'rejected':
      return tokens.color.coralInk;
    case 'submitted':
    case 'pending_review':
      return tokens.color.goldDeep;
    default:
      // draft / under_review — muted but AA-legible (plain `gray` is ~2.76:1 on white).
      return tokens.color.text2;
  }
};

// Mirrors the API's EDITABLE set (services/programs): drafts and rejected can be edited.
export const isEditable = (s: ProgramStatus): boolean => s === 'draft' || s === 'rejected';
