import type { StringKey } from '@incircleme/i18n';

// Maps a manual check-in attempt to the UI state + copy. Pure so the branching (success vs
// idempotent-already vs the backend's 409s vs a generic failure) is unit-testable.

export type CheckInUiState = 'success' | 'already' | 'invalidStatus' | 'wrongEvent' | 'error';

export interface CheckInOutcome {
  state: CheckInUiState;
  messageKey: StringKey;
  /** ok = forest success; warn = a non-fatal mismatch; error = retryable failure. Never gold. */
  tone: 'ok' | 'warn' | 'error';
}

/**
 * The attempt result: either a 200 (carrying whether the roster already showed them checked
 * in — the idempotent case), or a failure carrying the API status + error code.
 */
export type CheckInResult =
  | { ok: true; alreadyCheckedIn: boolean }
  | { ok: false; status: number; code: string };

export function mapCheckInOutcome(r: CheckInResult): CheckInOutcome {
  if (r.ok) {
    // Idempotent repeat is NOT an error — surface it as already-checked-in.
    return r.alreadyCheckedIn
      ? { state: 'already', messageKey: 'ck_resAlready', tone: 'ok' }
      : { state: 'success', messageKey: 'ck_resSuccess', tone: 'ok' };
  }
  if (r.status === 409 && r.code === 'wrong_event')
    return { state: 'wrongEvent', messageKey: 'ck_resWrongEvent', tone: 'warn' };
  if (r.status === 409 && r.code === 'invalid_status')
    return { state: 'invalidStatus', messageKey: 'ck_resInvalidStatus', tone: 'warn' };
  // 403 not_host, 404, network/500 → a generic, retryable error.
  return { state: 'error', messageKey: 'ck_resError', tone: 'error' };
}
