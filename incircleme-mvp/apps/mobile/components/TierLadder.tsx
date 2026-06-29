// The trust-tier ladder (Newcomer → Legend) with the user's current rung highlighted.
// For a new user this reads as an invitation (you're at the start), not a deficiency.
import { StyleSheet, Text, View } from 'react-native';
import type { TrustTier } from '@incircleme/types';
import { interpolate, t } from '@incircleme/i18n';
import { TIER_ORDER, tierIndex, tierLabel } from '../lib/trustTier';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

export function TierLadder({ current }: { current: TrustTier }) {
  const idx = Math.max(0, tierIndex(current));
  return (
    <View
      style={styles.ladder}
      accessibilityRole="text"
      accessibilityLabel={interpolate(t('pz_ladderA11y'), { tier: tierLabel(current) })}
    >
      {TIER_ORDER.map((tier, i) => {
        const active = i === idx;
        const reached = i <= idx;
        return (
          <View key={tier} style={styles.step}>
            <View style={[styles.dot, reached && styles.dotReached, active && styles.dotActive]} />
            <Text
              style={[styles.label, active ? styles.labelActive : null]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {tierLabel(tier)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ladder: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: tokens.color.border },
  dotReached: { borderColor: tokens.color.forest },
  dotActive: { backgroundColor: tokens.color.forest, borderColor: tokens.color.forest },
  // text2 on cream = 5.08:1 (AA); active forest on cream = 9.44:1. No gray-as-text, no goldGlow.
  label: { fontFamily: fonts.body, fontSize: 9.5, color: tokens.color.text2, textAlign: 'center' },
  labelActive: { fontFamily: fonts.bodySemi, color: tokens.color.forest },
});
