import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { t } from '@incircleme/i18n';
import type { OAuthProvider } from '@incircleme/types';
import { api } from '../../lib/api';
import { signInWithGoogle } from '../../lib/googleAuth';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { OnbScaffold } from '../../components/Onb';

export default function SignIn() {
  const router = useRouter();
  const [oauth, setOauth] = useState<OAuthProvider[]>([]);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  // Which OAuth providers the server has credentials for → gate Apple/LinkedIn gracefully.
  useEffect(() => {
    api
      .authProviders()
      .then((p) => setOauth(p.oauth))
      .catch(() => setOauth([]));
  }, []);

  // Sign-in FIRST: returning (already-onboarded) users skip straight to home.
  async function afterAuth() {
    try {
      const me = await api.me();
      router.replace(me.onboardingCompleted ? '/(tabs)' : '/onboarding/intent');
    } catch {
      router.replace('/onboarding/intent');
    }
  }

  async function google() {
    setBusy(true);
    const r = await signInWithGoogle();
    setBusy(false);
    if (r.ok) await afterAuth();
  }

  async function sendLink() {
    if (!email.includes('@')) return;
    setBusy(true);
    try {
      await api.requestMagicLink(email);
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  const appleOn = oauth.includes('apple');
  const linkedinOn = oauth.includes('linkedin');

  return (
    <OnbScaffold>
      <Text style={styles.title}>{t('onb_signin_title')}</Text>
      <Text style={styles.sub}>{t('onb_signin_sub')}</Text>

      <ProviderButton label={t('signInWithGoogle')} onPress={google} disabled={busy} />
      <ProviderButton label={t('onb_signin_apple')} onPress={() => {}} disabled={!appleOn} soon={!appleOn} />
      <ProviderButton
        label={t('onb_signin_linkedin')}
        onPress={() => {}}
        disabled={!linkedinOn}
        soon={!linkedinOn}
      />

      <View style={styles.orRow}>
        <View style={styles.rule} />
        <Text style={styles.or}>{t('onb_signin_or')}</Text>
        <View style={styles.rule} />
      </View>

      <Text style={styles.label}>{t('onb_signin_emailLabel')}</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t('onb_signin_emailPlaceholder')}
        placeholderTextColor={tokens.color.gray}
        autoCapitalize="none"
        keyboardType="email-address"
        inputMode="email"
        style={styles.input}
        accessibilityLabel={t('onb_signin_emailLabel')}
      />
      <Pressable
        onPress={sendLink}
        disabled={busy || !email.includes('@')}
        accessibilityRole="button"
        style={[styles.emailBtn, (busy || !email.includes('@')) && styles.disabled]}
      >
        <Text style={styles.emailBtnText}>{t('onb_signin_emailCta')}</Text>
      </Pressable>
      {sent ? <Text style={styles.sent}>{t('onb_signin_emailSent')}</Text> : null}

      <Text style={styles.legal}>{t('onb_signin_legal')}</Text>
    </OnbScaffold>
  );
}

function ProviderButton({
  label,
  onPress,
  disabled,
  soon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  soon?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.provider, disabled && styles.providerDisabled]}
    >
      <Text style={styles.providerText}>{label}</Text>
      {soon ? <Text style={styles.soon}>{t('onb_signin_soon')}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 30, color: tokens.color.ink, marginTop: 8 },
  sub: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: tokens.color.text2, marginTop: 8, marginBottom: 20 },
  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg2,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 10,
  },
  providerDisabled: { opacity: 0.55 },
  providerText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.ink },
  soon: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: tokens.color.goldDeep,
    borderWidth: 1,
    borderColor: tokens.color.goldDeep,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  rule: { flex: 1, height: 1, backgroundColor: tokens.color.border },
  or: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.gray },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.ink, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fonts.body,
    fontSize: 15,
    color: tokens.color.ink,
  },
  emailBtn: {
    backgroundColor: tokens.color.forest,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  emailBtnText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.cream },
  disabled: { opacity: 0.5 },
  sent: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.forest, marginTop: 10, lineHeight: 19 },
  legal: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: tokens.color.gray, marginTop: 20 },
});
