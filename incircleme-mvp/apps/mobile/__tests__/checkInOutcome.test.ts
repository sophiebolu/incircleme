import { mapCheckInOutcome } from '../lib/checkInOutcome';

describe('mapCheckInOutcome', () => {
  it('200 + not previously checked in → success (forest/ok)', () => {
    expect(mapCheckInOutcome({ ok: true, alreadyCheckedIn: false })).toEqual({
      state: 'success',
      messageKey: 'ck_resSuccess',
      tone: 'ok',
    });
  });

  it('200 + already checked in (idempotent) → already, NOT an error', () => {
    const o = mapCheckInOutcome({ ok: true, alreadyCheckedIn: true });
    expect(o.state).toBe('already');
    expect(o.tone).toBe('ok');
  });

  it('409 invalid_status → invalidStatus (warn)', () => {
    expect(mapCheckInOutcome({ ok: false, status: 409, code: 'invalid_status' })).toEqual({
      state: 'invalidStatus',
      messageKey: 'ck_resInvalidStatus',
      tone: 'warn',
    });
  });

  it('409 wrong_event → wrongEvent (warn)', () => {
    expect(mapCheckInOutcome({ ok: false, status: 409, code: 'wrong_event' })).toEqual({
      state: 'wrongEvent',
      messageKey: 'ck_resWrongEvent',
      tone: 'warn',
    });
  });

  it('403 not_host → generic error (retryable)', () => {
    const o = mapCheckInOutcome({ ok: false, status: 403, code: 'not_host' });
    expect(o.state).toBe('error');
    expect(o.tone).toBe('error');
  });

  it('network/500 → generic error', () => {
    expect(mapCheckInOutcome({ ok: false, status: 500, code: 'http_500' }).state).toBe('error');
    expect(mapCheckInOutcome({ ok: false, status: 0, code: 'network' }).state).toBe('error');
  });
});
