// Shared onboarding chrome — a TOP-LEFT wordmark (matching the Home/Profile BrandBar),
// step dots (centred, below the CTA), the primary button, shared title/sub/badge, and the
// screen scaffold. Colours/fonts from theme tokens; labels passed in already localised
// via t().
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

/**
 * On/off toggle built from plain Views — the "on" colour is OURS (forest), not the
 * OS <Switch> (Android ignores Switch trackColor, especially when disabled, which is
 * why the locked toggle still showed the platform green/teal). On = forest track +
 * light thumb (right); off = neutral grey track + thumb (left). State reads from BOTH
 * colour and thumb position (not colour alone) for a11y. The locked "always on" case
 * passes `disabled` → forest on-state, non-pressable.
 */
export function OnbToggle({
  value,
  onChange,
  disabled,
  label,
}: {
  value: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : () => onChange?.(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={label}
      hitSlop={8}
      style={styles.toggleTap}
    >
      <View style={[styles.toggleTrack, value ? styles.toggleOn : styles.toggleOff]}>
        <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
      </View>
    </Pressable>
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
      accessibilityValue={{ min: 1, now: step, max: total }}
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
  busy,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const isDisabled = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!busy }}
      style={[styles.btn, isDisabled && styles.btnDisabled]}
    >
      {busy ? (
        <ActivityIndicator color={tokens.color.cream} />
      ) : (
        /* Disabled state: solid gray bg + ink label (AA ≥4.5:1), not a faded cream-on-cream. */
        <Text style={[styles.btnText, isDisabled && styles.btnTextDisabled]}>{label} →</Text>
      )}
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
  dots: { flexDirection: 'row', gap: 4, justifyContent: 'center', marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: tokens.color.border },
  dotOn: { backgroundColor: tokens.color.coral },
  body: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  btn: {
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: tokens.color.gray },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 16, color: tokens.color.cream },
  btnTextDisabled: { color: tokens.color.ink },
  // Custom toggle — ≥44×48 tap target wrapping a 46×28 track + 22px thumb.
  toggleTap: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  toggleTrack: { width: 46, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: tokens.color.forest },
  toggleOff: { backgroundColor: tokens.color.gray },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: tokens.color.bg2,
    shadowColor: '#1C1C1E',
    shadowOpacity: 0.18,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  toggleThumbOff: { alignSelf: 'flex-start' },
});
