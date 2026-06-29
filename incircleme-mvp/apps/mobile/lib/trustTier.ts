import { t, type StringKey } from '@incircleme/i18n';
import type { PassportSummary, TrustTier } from '@incircleme/types';

/** The trust-tier ladder, low → high. Display order on the Passport. */
export const TIER_ORDER: TrustTier[] = ['newcomer', 'regular', 'trusted', 'pillar', 'legend'];

/** Rung index on the ladder (0 = newcomer). -1 for an unknown tier. */
export const tierIndex = (tier: string): number => TIER_ORDER.indexOf(tier as TrustTier);

/** A brand-new passport — nothing earned yet → show the warm first-state, not cold 0/—. */
export const hasNoActivity = (pp: PassportSummary): boolean =>
  pp.attended === 0 &&
  pp.hosted === 0 &&
  pp.bookings === 0 &&
  pp.reviewsReceived.count === 0 &&
  pp.reviewsGiven === 0 &&
  pp.activeCircles === 0;

// Locale-aware trust-tier labels (§26). Single source of truth so HostRow and
// Profile render the same human label in the active locale, not the raw enum.
const TIER_KEY: Record<TrustTier, StringKey> = {
  newcomer: 'tier_newcomer',
  regular: 'tier_regular',
  trusted: 'tier_trusted',
  pillar: 'tier_pillar',
  legend: 'tier_legend',
};

/** Maps a trust-tier enum to its localized label, falling back to the raw value. */
export const tierLabel = (tier: string): string => {
  const key = TIER_KEY[tier as TrustTier];
  return key ? t(key) : tier;
};
