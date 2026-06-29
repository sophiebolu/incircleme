import { showVerifiedBadge } from '../lib/verifiedBadge';

describe('showVerifiedBadge', () => {
  // No real identity verification exists yet, so the badge is hidden for EVERYONE — including
  // users whose account-level `verified` flag is true (that flag is set at signup, not a real
  // identity check). This is the key behaviour: a truthy account flag must NOT surface a badge.
  it('returns false even when the account-level verified flag is true (no false identity claim)', () => {
    expect(showVerifiedBadge({ verified: true })).toBe(false);
  });

  it('returns false when not verified', () => {
    expect(showVerifiedBadge({ verified: false })).toBe(false);
  });

  // When a real identity signal lands (host KYC / Stripe Connect), this should return true for an
  // identity-verified user — see the seam comment in lib/verifiedBadge.ts.
});
