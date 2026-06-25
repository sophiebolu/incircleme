import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { t } from '@incircleme/i18n';
import type { OAuthProvider } from '@incircleme/types';
import { api } from '../../lib/api';
import { signInWithGoogle } from '../../lib/googleAuth';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { OnbBadge, OnbScaffold, OnbSub, OnbTitle } from '../../components/Onb';

export default function SignIn() {
  const router = useRouter();
  const [oauth, setOauth] = useState<OAuthProvider[]>([]);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      const r = await signInWithGoogle();
      if (r.ok) await afterAuth();
    } catch {
      setError(t('onb_error_retry'));
    } finally {
      setBusy(false);
    }
  }

  async function sendLink() {
    if (!email.includes('@')) return;
    setBusy(true);
    setError(null);
    try {
      await api.requestMagicLink(email);
      setSent(true);
    } catch {
      setError(t('onb_error_retry'));
    } finally {
      setBusy(false);
    }
  }

  const appleOn = oauth.includes('apple');
  const linkedinOn = oauth.includes('linkedin');
  const emailDisabled = busy || !email.includes('@');

  return (
    <OnbScaffold>
      <OnbTitle size={30}>{t('onb_signin_title')}</OnbTitle>
      <OnbSub>{t('onb_signin_sub')}</OnbSub>

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
        placeholderTextColor={tokens.color.text2}
        autoCapitalize="none"
        keyboardType="email-address"
        inputMode="email"
        style={styles.input}
        accessibilityLabel={t('onb_signin_emailLabel')}
      />
      <Pressable
        onPress={sendLink}
        disabled={emailDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: emailDisabled }}
        style={[styles.emailBtn, emailDisabled && styles.disabled]}
      >
        <Text style={styles.emailBtnText}>{t('onb_signin_emailCta')}</Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
      {soon ? <OnbBadge label={t('onb_signin_soon')} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg2,
    borderRadius: 999,
    minHeight: 48, // ≥48dp touch target (a11y)
    marginBottom: 8,
  },
  providerDisabled: { opacity: 0.55 },
  providerText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.ink },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  rule: { flex: 1, height: 1, backgroundColor: tokens.color.border },
  or: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.text2 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.ink, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: tokens.color.ink,
  },
  emailBtn: {
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  emailBtnText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.cream },
  disabled: { opacity: 0.5 },
  errorText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: tokens.color.coralInk, marginTop: 8, lineHeight: 19 },
  sent: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.forest, marginTop: 8, lineHeight: 19 },
  legal: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: tokens.color.text2, marginTop: 20 },
});
