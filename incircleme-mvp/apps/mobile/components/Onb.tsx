// Shared onboarding chrome — a STEADY top wordmark (centred, identical size/weight/
// position on every step), step dots (centred, below the CTA), the primary button, and
// the screen scaffold. Colours/fonts from theme tokens; labels passed in already
// localised via t().
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { t } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';
import { ONB_TOTAL_STEPS } from '../lib/onboarding';

/** The IncircleMe wordmark — ONE definition, rendered identically on every onboarding screen. */
export function OnbWordmark() {
  return (
    <Text style={styles.brand} allowFontScaling={false}>
      Incircle<Text style={styles.brandMe}>Me</Text>
    </Text>
  );
}

/**
 * Top bar: the wordmark is CENTRED and never shifted by the back arrow (which is an
 * absolutely-positioned, separate left control). Identical on welcome / sign-in / every
 * step, so the logo stays steady across the whole flow.
 */
export function OnbHeader({ onBack, showBack }: { onBack?: () => void; showBack?: boolean }) {
  const router = useRouter();
  const canBack = showBack ?? router.canGoBack();
  return (
    <View style={styles.bar}>
      {canBack ? (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          accessibilityRole="button"
          accessibilityLabel={t('onb_back')}
          hitSlop={10}
          style={styles.backAbs}
        >
          <Text style={styles.back}>←</Text>
        </Pressable>
      ) : null}
      <OnbWordmark />
    </View>
  );
}

export function StepDots({ step, total = ONB_TOTAL_STEPS }: { step: number; total?: number }) {
  return (
    <View
      style={styles.dots}
      accessibilityRole="progressbar"
      accessibilityLabel={t('onb_stepOf')
        .replace('{n}', String(step))
        .replace('{total}', String(total))}
    >
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, i < step && styles.dotOn]} />
      ))}
    </View>
  );
}

export function OnbButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.btn, disabled && styles.btnDisabled]}
    >
      <Text style={styles.btnText}>{label} →</Text>
    </Pressable>
  );
}

export function OnbScaffold({
  step,
  onBack,
  children,
  footer,
}: {
  step?: number;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnbHeader onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer || step ? (
        <View style={styles.footer}>
          {footer}
          {/* Step dots: centred, directly below the Continue CTA. */}
          {step ? <StepDots step={step} /> : null}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  // Absolute so the wordmark stays dead-centre regardless of the back button.
  backAbs: { position: 'absolute', left: 20, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
  back: { fontFamily: fonts.body, fontSize: 22, color: tokens.color.ink },
  brand: { fontFamily: fonts.displaySemi, fontSize: 18, color: tokens.color.forest },
  brandMe: { color: tokens.color.coralInk, fontFamily: fonts.displayItalic },
  dots: { flexDirection: 'row', gap: 5, justifyContent: 'center', marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: tokens.color.border },
  dotOn: { backgroundColor: tokens.color.coral },
  body: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  btn: {
    backgroundColor: tokens.color.forest,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: tokens.color.gray, opacity: 0.6 },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 16, color: tokens.color.cream },
});
