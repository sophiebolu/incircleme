import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MeResponse } from '@incircleme/types';
import { t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { clearSession, isSignedIn, saveSession } from '../../lib/auth';
import { BrandBar } from '../../components/BrandBar';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

// Dev sign-in: request the magic link (the API stub logs it), paste the token here.
// The real deep-link flow (incircleme://auth/verify) replaces the paste box in Phase 2.
export default function Profile() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  // 'error-verify' keeps the token field visible so a fresh code can be pasted.
  const [phase, setPhase] = useState<'idle' | 'sent' | 'error-request' | 'error-verify'>('idle');

  useEffect(() => {
    (async () => {
      if (await isSignedIn()) {
        try {
          setMe(await api.me());
        } catch {
          await clearSession();
        }
      }
    })();
  }, []);

  const requestLink = async () => {
    try {
      await api.requestMagicLink(email.trim());
      setPhase('sent');
      setToken('');
    } catch {
      setPhase('error-request');
    }
  };

  const verify = async () => {
    try {
      const result = await api.verifyMagicLink(token.trim());
      await saveSession(result);
      setMe(result.user);
      setPhase('idle');
    } catch {
      // Promise-Delivery rule: a failed verify must say so, visibly.
      setPhase('error-verify');
    }
  };

  const signOut = async () => {
    await clearSession();
    setMe(null);
    setPhase('idle');
    setToken('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <Text style={styles.heading}>{t('profile')}</Text>
      {me ? (
        <View style={styles.card}>
          <Text style={styles.name}>{me.displayName ?? me.email}</Text>
          <Text style={styles.meta}>
            {me.neighbourhood ?? 'Barcelona'} · {me.trustTier}
          </Text>
          <Pressable style={styles.buttonGhost} onPress={signOut}>
            <Text style={styles.buttonGhostText}>Surt</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>{t('signIn')}</Text>
          <TextInput
            style={styles.input}
            placeholder="correu@exemple.cat"
            placeholderTextColor={tokens.color.gray}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Pressable style={styles.button} onPress={requestLink}>
            <Text style={styles.buttonText}>{t('continueLabel')}</Text>
          </Pressable>
          {phase === 'sent' || phase === 'error-verify' ? (
            <>
              <Text style={styles.hint}>Token (vegeu el registre del servidor en dev):</Text>
              <TextInput
                style={styles.input}
                placeholder="token"
                placeholderTextColor={tokens.color.gray}
                autoCapitalize="none"
                value={token}
                onChangeText={setToken}
              />
              <Pressable style={styles.button} onPress={verify}>
                <Text style={styles.buttonText}>{t('signIn')}</Text>
              </Pressable>
            </>
          ) : null}
          {phase === 'error-verify' ? (
            <Text style={styles.error}>{t('verifyFailed')}</Text>
          ) : null}
          {phase === 'error-request' ? (
            <Text style={styles.error}>{t('requestFailed')}</Text>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  heading: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: tokens.color.ink,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  name: { fontFamily: fonts.displaySemi, fontSize: 18, color: tokens.color.ink },
  meta: { fontFamily: fonts.body, fontSize: 12.5, color: tokens.color.gray },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.ink },
  input: {
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 14,
    color: tokens.color.ink,
  },
  button: {
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.cream },
  buttonGhost: {
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonGhostText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: tokens.color.ink },
  hint: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.gray },
  error: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: tokens.color.coralInk,
    backgroundColor: 'rgba(166,86,58,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
