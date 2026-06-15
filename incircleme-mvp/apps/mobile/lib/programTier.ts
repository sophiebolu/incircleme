import type { VerificationTier } from '@incircleme/types';
import { t } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';

// §24 tier badges. Colours are the AA-passing tokens from Part 1 (goldDeep #7E6410
// = 5.65:1 on white; forest #2E4531 = 10.4:1) — never the bright decorative gold.
export const tierLabel = (tier: VerificationTier): string =>
  tier === 'accredited' ? t('prog_pub_badgeAccredited') : t('prog_pub_badgeVerified');

export const tierColor = (tier: VerificationTier): string =>
  tier === 'accredited' ? tokens.color.forest : tokens.color.goldDeep;
