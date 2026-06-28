// Shared blank-state chrome (Capsule/S2 pattern) — loading skeleton, error-with-retry,
// and not-found. Reused on the ticket + bookings screens so no screen ships a blank shell.
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshCw } from 'lucide-react-native';
import { t } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

const SWEEP_W = Dimensions.get('window').width;

/**
 * Warm shimmer placeholder — a forestSoft ground with a soft cream highlight sweeping
 * across, so a loading block reads "content is coming" rather than "broken". Falls back to
 * a static block when the OS has Reduce Motion on. Decorative (no text → AA N/A).
 */
function Shimmer({ style }: { style?: StyleProp<ViewStyle> }) {
  const x = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: 1,
        duration: 1300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, x]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-SWEEP_W, SWEEP_W] });

  return (
    <View style={[styles.shimmerBase, style]}>
      {!reduceMotion ? (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(247,243,237,0.65)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Loading skeleton — warm shimmer hero (loaded-hero aspect) + two lines. */
export function ScreenSkeleton() {
  return (
    <View style={styles.skelWrap} accessibilityLabel={t('err_loading')}>
      <Shimmer style={styles.skelHero} />
      <Shimmer style={[styles.skelLine, styles.skelWide]} />
      <Shimmer style={[styles.skelLine, styles.skelNarrow]} />
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
  shimmerBase: { backgroundColor: tokens.color.forestSoft, overflow: 'hidden' },
  skelHero: { height: 168, borderRadius: 16 },
  skelLine: { height: 14, borderRadius: 6 },
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
