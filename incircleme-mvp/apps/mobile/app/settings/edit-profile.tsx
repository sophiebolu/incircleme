import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { getActiveLocale, t } from '@incircleme/i18n';
import type { Locale, StringKey } from '@incircleme/i18n';
import type { MeResponse } from '@incircleme/types';
import { api } from '../../lib/api';
import { setUserLocale } from '../../lib/userLocale';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const LANGS: { code: Locale; label: StringKey }[] = [
  { code: 'ca', label: 'set_lang_ca' },
  { code: 'es', label: 'set_lang_es' },
  { code: 'en', label: 'set_lang_en' },
];

export default function EditProfile() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [barrio, setBarrio] = useState('');
  const [lang, setLang] = useState<Locale>(getActiveLocale());
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((m) => {
        setMe(m);
        setName(m.displayName ?? '');
        setBio(m.bio ?? '');
        setBarrio(m.neighbourhood ?? '');
        setLang(m.language);
      })
      .catch(() => {});
  }, []);

  async function save() {
    setBusy(true);
    try {
      await api.updateMe({
        displayName: name.trim() || undefined,
        bio: bio.trim(),
        neighbourhood: barrio.trim() || undefined,
        language: lang,
      });
      if (lang !== getActiveLocale()) await setUserLocale(lang); // applies live + persists
      setSaved(true);
      setTimeout(() => router.back(), 600);
    } finally {
      setBusy(false);
    }
  }

  const initial = (me?.displayName ?? me?.email ?? '?').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.bar}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={10}>
          <ChevronLeft size={24} color={tokens.color.ink} />
        </Pressable>
        <Text style={styles.title}>{t('ep_title')}</Text>
        <View style={styles.barSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarWrap}>
          {me?.avatarUrl ? (
            <Image source={{ uri: me.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          {/* Avatar upload is a follow-up — image-picker + upload endpoint (TODO). */}
          <Pressable onPress={() => {}} accessibilityRole="button">
            <Text style={styles.changePhoto}>{t('ep_changePhoto')}</Text>
          </Pressable>
        </View>

        <Field label="ep_name">
          <TextInput value={name} onChangeText={setName} placeholder={t('ep_namePlaceholder')} placeholderTextColor={tokens.color.text2} style={styles.input} />
        </Field>
        <Field label="ep_bio">
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder={t('ep_bioPlaceholder')}
            placeholderTextColor={tokens.color.text2}
            multiline
            maxLength={500}
            style={[styles.input, styles.inputMultiline]}
          />
        </Field>
        <Field label="ep_barrio">
          <TextInput value={barrio} onChangeText={setBarrio} placeholder={t('ep_barrioPlaceholder')} placeholderTextColor={tokens.color.text2} style={styles.input} />
        </Field>
        <Field label="ep_language">
          <View style={styles.langRow}>
            {LANGS.map((l) => (
              <Pressable
                key={l.code}
                onPress={() => setLang(l.code)}
                accessibilityRole="radio"
                accessibilityState={{ selected: l.code === lang }}
                style={[styles.langChip, l.code === lang && styles.langChipOn]}
              >
                <Text style={[styles.langChipText, l.code === lang && styles.langChipTextOn]}>{t(l.label)}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Pressable onPress={save} disabled={busy} accessibilityRole="button" style={[styles.save, busy && styles.disabled]}>
          <Text style={styles.saveText}>{saved ? t('ep_saved') : t('ep_save')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: StringKey; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{t(label)}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.displaySemi, fontSize: 18, color: tokens.color.ink },
  barSpacer: { width: 24 },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  avatarWrap: { alignItems: 'center', gap: 10, marginVertical: 16 },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarFallback: { backgroundColor: tokens.color.forestSoft, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: fonts.displaySemi, fontSize: 32, color: tokens.color.forest },
  changePhoto: { fontFamily: fonts.bodyMedium, fontSize: 14, color: tokens.color.forest },
  field: { marginTop: 18 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.ink, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: tokens.color.ink,
  },
  inputMultiline: { minHeight: 84, textAlignVertical: 'top' },
  langRow: { flexDirection: 'row', gap: 10 },
  langChip: { borderWidth: 1, borderColor: tokens.color.border, backgroundColor: tokens.color.bg2, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  langChipOn: { borderColor: tokens.color.coral, backgroundColor: tokens.color.coral },
  langChipText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: tokens.color.ink },
  langChipTextOn: { color: tokens.color.cream },
  save: { backgroundColor: tokens.color.forest, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 28 },
  saveText: { fontFamily: fonts.bodySemi, fontSize: 16, color: tokens.color.cream },
  disabled: { opacity: 0.5 },
});
