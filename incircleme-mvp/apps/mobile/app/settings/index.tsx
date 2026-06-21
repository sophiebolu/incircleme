import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { getActiveLocale, t } from '@incircleme/i18n';
import type { Locale, StringKey } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { clearSession } from '../../lib/auth';
import { setUserLocale } from '../../lib/userLocale';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const LANGS: { code: Locale; label: StringKey }[] = [
  { code: 'ca', label: 'set_lang_ca' },
  { code: 'es', label: 'set_lang_es' },
  { code: 'en', label: 'set_lang_en' },
];

export default function Settings() {
  const router = useRouter();
  const active = getActiveLocale();

  async function pickLanguage(code: Locale) {
    if (code === active) return;
    // Persist the manual choice (local + profile) and switch live. The app re-renders in
    // the new language via the locale-keyed root navigator.
    await setUserLocale(code);
    api.updateMe({ language: code }).catch(() => {});
  }

  async function signOut() {
    await clearSession();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.bar}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={10}>
          <ChevronLeft size={24} color={tokens.color.ink} />
        </Pressable>
        <Text style={styles.title}>{t('set_title')}</Text>
        <View style={styles.barSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Notifications — reuses onboarding notification_prefs (parallel branch). */}
        <Text style={styles.section}>{t('set_notifications')}</Text>
        <View style={styles.card}>
          <NotifRow label="set_notif_bookings" always />
          <NotifRow label="set_notif_circles" />
          <NotifRow label="set_notif_nearby" last />
        </View>
        <Text style={styles.note}>{t('set_notifManaged')}</Text>

        {/* Language — in-app picker, applies live + persists, overrides device default. */}
        <Text style={styles.section}>{t('set_language')}</Text>
        <View style={styles.card}>
          {LANGS.map((l, i) => (
            <Pressable
              key={l.code}
              onPress={() => pickLanguage(l.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: l.code === active }}
              style={[styles.row, i < LANGS.length - 1 && styles.rowDivider]}
            >
              <Text style={styles.rowLabel}>{t(l.label)}</Text>
              {l.code === active ? <Check size={18} color={tokens.color.coral} /> : null}
            </Pressable>
          ))}
        </View>

        {/* Account */}
        <Text style={styles.section}>{t('set_account')}</Text>
        <View style={styles.card}>
          <LinkRow label="set_editProfile" onPress={() => router.push('/settings/edit-profile')} />
          <LinkRow label="set_deactivate" onPress={() => router.push('/settings/deactivate')} />
          <LinkRow label="signOut" onPress={signOut} last />
        </View>

        {/* Privacy & legal */}
        <Text style={styles.section}>{t('set_legalSection')}</Text>
        <View style={styles.card}>
          <LinkRow label="set_privacyPolicy" onPress={() => {}} />
          <LinkRow label="set_terms" onPress={() => {}} last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NotifRow({ label, always, last }: { label: StringKey; always?: boolean; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{t(label)}</Text>
      {always ? (
        <Text style={styles.always}>{t('set_notif_always')}</Text>
      ) : (
        // Disabled until onboarding's notification_prefs lands on this branch (no faked persistence).
        <Switch value disabled />
      )}
    </View>
  );
}

function LinkRow({ label, onPress, last }: { label: StringKey; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.row, !last && styles.rowDivider]}
    >
      <Text style={styles.rowLabel}>{t(label)}</Text>
      <ChevronRight size={18} color={tokens.color.gray} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.displaySemi, fontSize: 18, color: tokens.color.ink },
  barSpacer: { width: 24 },
  body: { paddingHorizontal: 20, paddingBottom: 32 },
  section: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.color.text2,
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    backgroundColor: tokens.color.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.color.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: tokens.color.border },
  rowLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, color: tokens.color.ink },
  always: { fontFamily: fonts.bodySemi, fontSize: 12, color: tokens.color.goldDeep },
  note: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: tokens.color.gray, marginTop: 8 },
});
