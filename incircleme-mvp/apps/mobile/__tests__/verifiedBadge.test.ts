import { showVerifiedBadge } from '../lib/verifiedBadge';

describe('showVerifiedBadge', () => {
  it('shows the badge only when verified is true', () => {
    expect(showVerifiedBadge({ verified: true })).toBe(true);
  });

  it('hides the badge when not verified (no false "verified" claim)', () => {
    expect(showVerifiedBadge({ verified: false })).toBe(false);
  });
});
