// Trust-tier display labels (Catalan, vocab-locked). Single source of truth so
// HostRow and Profile render the same human label instead of the raw enum.
export const TIER_LABEL: Record<string, string> = {
  newcomer: 'Nouvingut/da',
  regular: 'Habitual',
  trusted: 'De confiança',
  pillar: 'Pilar',
  legend: 'Llegenda',
};

/** Maps a trust-tier enum to its display label, falling back to the raw value. */
export const tierLabel = (tier: string): string => TIER_LABEL[tier] ?? tier;
