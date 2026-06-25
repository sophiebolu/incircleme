// Shared onboarding chrome — a TOP-LEFT wordmark (matching the Home/Profile BrandBar),
// step dots (centred, below the CTA), the primary button, shared title/sub/badge, and the
// screen scaffold. Colours/fonts from theme tokens; labels passed in already localised
// via t().
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { t } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';
import { ONB_TOTAL_STEPS } from '../lib/onboarding';

/**
 * The IncircleMe wordmark — ONE definition, matching the Home/Profile BrandBar
 * (Fraunces 19px, ink, "Me" italic coral), so the logo reads identically app-wide.
 */
export function OnbWordmark() {
  return (
    <Text style={styles.brand} allowFontScaling={false}>
      Incircle<Text style={styles.brandMe}>Me</Text>
    </Text>
  );
}

/** Top bar: wordmark TOP-LEFT (like Home/Profile), with the back arrow as the left-most control. */
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
          hitSlop={8}
          style={styles.backBtn}
        >
          <Text style={styles.back}>←</Text>
        </Pressable>
      ) : null}
      <OnbWordmark />
    </View>
  );
}

/** Shared step title — one style; size overridable, sizes preserved per screen. */
export function OnbTitle({ children, size = 28 }: { children: ReactNode; size?: number }) {
  return (
    <Text style={[styles.title, { fontSize: size, lineHeight: Math.round(size * 1.2) }]}>
      {children}
    </Text>
  );
}

/** Shared step subtitle. */
export function OnbSub({ children }: { children: ReactNode }) {
  return <Text style={styles.sub}>{children}</Text>;
}

/** Small status chip (e.g. "Soon" / "Always on") — AA deep-gold, one definition. */
export function OnbBadge({ label }: { label: string }) {
  return <Text style={styles.badge}>{label}</Text>;
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
      {/* Disabled state: solid gray bg + ink label (AA ≥4.5:1), not a faded cream-on-cream. */}
      <Text style={[styles.btnText, disabled && styles.btnTextDisabled]}>{label} →</Text>
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
  // Top-left brand row, matching the Home/Profile BrandBar padding.
  bar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10 },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center', marginLeft: -10 },
  back: { fontFamily: fonts.body, fontSize: 22, color: tokens.color.ink },
  brand: { fontFamily: fonts.displaySemi, fontSize: 19, letterSpacing: -0.34, color: tokens.color.ink },
  brandMe: { fontFamily: fonts.displayItalic, color: tokens.color.coral },
  title: { fontFamily: fonts.display, color: tokens.color.ink, marginTop: 4 },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: tokens.color.text2,
    marginTop: 6,
    marginBottom: 18,
  },
  badge: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: tokens.color.goldDeep,
    borderWidth: 1,
    borderColor: tokens.color.goldDeep,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
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
  btnDisabled: { backgroundColor: tokens.color.gray },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 16, color: tokens.color.cream },
  btnTextDisabled: { color: tokens.color.ink },
});
