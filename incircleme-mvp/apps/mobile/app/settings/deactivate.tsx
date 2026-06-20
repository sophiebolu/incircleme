import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { clearSession } from '../../lib/auth';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

export default function Deactivate() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await api.deactivateMe(); // reversible — data retained; sign back in to reactivate
      await clearSession();
      setDone(true);
      setTimeout(() => router.replace('/'), 1200);
    } catch {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.bar}>
        {!done ? (
          <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={10}>
            <ChevronLeft size={24} color={tokens.color.ink} />
          </Pressable>
        ) : (
          <View style={styles.barSpacer} />
        )}
      </View>
      <View style={styles.body}>
        {done ? (
          <Text style={styles.done}>{t('da_done')}</Text>
        ) : (
          <>
            <Text style={styles.title}>{t('da_title')}</Text>
            <Text style={styles.bodyText}>{t('da_body')}</Text>
            <View style={styles.reversibleCard}>
              <Text style={styles.reversible}>{t('da_reversible')}</Text>
            </View>
          </>
        )}
      </View>
      {!done ? (
        <View style={styles.footer}>
          <Pressable onPress={confirm} disabled={busy} accessibilityRole="button" style={[styles.confirm, busy && styles.disabled]}>
            <Text style={styles.confirmText}>{t('da_confirm')}</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} disabled={busy} accessibilityRole="button" style={styles.cancelWrap}>
            <Text style={styles.cancel}>{t('da_cancel')}</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  barSpacer: { height: 24 },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  title: { fontFamily: fonts.display, fontSize: 30, color: tokens.color.ink, marginBottom: 16 },
  bodyText: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: tokens.color.text2 },
  reversibleCard: {
    marginTop: 20,
    backgroundColor: tokens.color.forestSoft,
    borderRadius: 14,
    padding: 16,
  },
  reversible: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22, color: tokens.color.forest },
  done: { fontFamily: fonts.displayItalic, fontSize: 22, lineHeight: 30, color: tokens.color.coralInk, textAlign: 'center' },
  footer: { paddingHorizontal: 28, paddingBottom: 24, gap: 14 },
  // Warm, not alarming — forest, never destructive red (softened-tone decision).
  confirm: { backgroundColor: tokens.color.forest, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmText: { fontFamily: fonts.bodySemi, fontSize: 16, color: tokens.color.cream },
  cancelWrap: { alignItems: 'center' },
  cancel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: tokens.color.text2 },
  disabled: { opacity: 0.5 },
});
