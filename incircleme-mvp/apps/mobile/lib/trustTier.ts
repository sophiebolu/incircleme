import { t, type StringKey } from '@incircleme/i18n';
import type { TrustTier } from '@incircleme/types';

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
