// Shared blank-state chrome (Capsule/S2 pattern) — loading skeleton, error-with-retry,
// and not-found. Reused on the ticket + bookings screens so no screen ships a blank shell.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { t } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

/** Loading skeleton — hero block + two lines. */
export function ScreenSkeleton() {
  return (
    <View style={styles.skelWrap} accessibilityLabel={t('err_loading')}>
      <View style={styles.skelHero} />
      <View style={[styles.skelLine, styles.skelWide]} />
      <View style={[styles.skelLine, styles.skelNarrow]} />
    </View>
  );
}

/** Error card — tap anywhere to retry (the copy says "Try again"). */
export function ErrorRetry({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Pressable
        style={styles.errorCard}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t('cs_errorRetry')}
      >
        <RefreshCw size={18} color={tokens.color.forest} strokeWidth={2} />
        <Text style={styles.errorText}>{t('cs_errorRetry')}</Text>
      </Pressable>
    </View>
  );
}

/** Not-found — warm, no chrome. */
export function NotFound() {
  return (
    <View style={styles.center}>
      <Text style={styles.notFound}>{t('err_notFound')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  skelWrap: { padding: 16, gap: 8 },
  skelHero: { height: 168, borderRadius: 16, backgroundColor: tokens.color.border },
  skelLine: { height: 14, borderRadius: 6, backgroundColor: tokens.color.border },
  skelWide: { width: '60%', marginTop: 16 },
  skelNarrow: { width: '40%', marginTop: 8 },
  center: { paddingTop: 56, paddingHorizontal: 24, alignItems: 'center', gap: 8 },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  errorText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: tokens.color.forest },
  notFound: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: tokens.color.text2, textAlign: 'center' },
});
