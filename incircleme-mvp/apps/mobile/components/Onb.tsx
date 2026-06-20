// Shared onboarding chrome — step dots, primary button, and the screen scaffold
// (brand bar + optional back + scrollable body). Colours/fonts come from theme tokens;
// text/labels are passed in already localised via t().
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { t } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';
import { ONB_TOTAL_STEPS } from '../lib/onboarding';

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
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.bar}>
        {onBack || router.canGoBack() ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            accessibilityRole="button"
            accessibilityLabel={t('onb_back')}
            hitSlop={10}
          >
            <Text style={styles.back}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <Text style={styles.brand}>
          Incircle<Text style={styles.brandMe}>Me</Text>
        </Text>
        {step ? <StepDots step={step} /> : <View style={styles.backSpacer} />}
      </View>
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  back: { fontFamily: fonts.body, fontSize: 22, color: tokens.color.ink, width: 44 },
  backSpacer: { width: 44 },
  brand: { fontFamily: fonts.displaySemi, fontSize: 17, color: tokens.color.forest },
  brandMe: { color: tokens.color.coralInk, fontFamily: fonts.displayItalic },
  dots: { flexDirection: 'row', gap: 5, width: 44, justifyContent: 'flex-end' },
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
