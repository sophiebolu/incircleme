import { TIER_ORDER, tierIndex, hasNoActivity } from '../lib/trustTier';
import type { PassportSummary } from '@incircleme/types';

describe('tierIndex', () => {
  it('maps each tier to its rung, low → high', () => {
    expect(TIER_ORDER).toEqual(['newcomer', 'regular', 'trusted', 'pillar', 'legend']);
    expect(tierIndex('newcomer')).toBe(0);
    expect(tierIndex('regular')).toBe(1);
    expect(tierIndex('trusted')).toBe(2);
    expect(tierIndex('pillar')).toBe(3);
    expect(tierIndex('legend')).toBe(4);
  });
  it('returns -1 for an unknown tier (caller clamps to 0)', () => {
    expect(tierIndex('bogus')).toBe(-1);
  });
});

// hasNoActivity reads only the six activity counters.
const mk = (over: Partial<PassportSummary>): PassportSummary =>
  ({
    attended: 0,
    hosted: 0,
    bookings: 0,
    reviewsReceived: { count: 0, avgRating: 0, wouldGoAgainCount: 0, feltIncludedCount: 0 },
    reviewsGiven: 0,
    activeCircles: 0,
    ...over,
  }) as unknown as PassportSummary;

describe('hasNoActivity', () => {
  it('true for a brand-new passport (all counters zero)', () => {
    expect(hasNoActivity(mk({}))).toBe(true);
  });
  it('false as soon as any single counter is non-zero', () => {
    expect(hasNoActivity(mk({ attended: 1 }))).toBe(false);
    expect(hasNoActivity(mk({ hosted: 1 }))).toBe(false);
    expect(hasNoActivity(mk({ bookings: 1 }))).toBe(false);
    expect(hasNoActivity(mk({ reviewsGiven: 1 }))).toBe(false);
    expect(hasNoActivity(mk({ activeCircles: 1 }))).toBe(false);
    expect(
      hasNoActivity(
        mk({
          reviewsReceived: { count: 1, avgRating: 5, wouldGoAgainCount: 1, feltIncludedCount: 1, tagCounts: {} },
        }),
      ),
    ).toBe(false);
  });
});
