import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, ChevronRight, MapPin, Sparkles } from 'lucide-react-native';
import type { MeResponse, MeStats } from '@incircleme/types';
import { formatDate, interpolate, t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { clearSession, isSignedIn, saveSession } from '../../lib/auth';
import { tierLabel } from '../../lib/trustTier';
import { useNavClearance } from '../../lib/useNavClearance';
import { signInWithGoogle } from '../../lib/googleAuth';
import { BrandBar } from '../../components/BrandBar';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

// Dev sign-in: request the magic link (the API stub logs it), paste the token here.
// The real deep-link flow (incircleme://auth/verify) replaces the paste box in Phase 2.
export default function Profile() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [stats, setStats] = useState<MeStats | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const navClearance = useNavClearance();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  // 'error-verify' keeps the token field visible so a fresh code can be pasted.
  const [phase, setPhase] = useState<'idle' | 'sent' | 'error-request' | 'error-verify'>('idle');
  const [googleError, setGoogleError] = useState(false);

  const googleSignIn = async () => {
    setGoogleError(false);
    const result = await signInWithGoogle();
    if (result.ok) {
      try {
        setMe(await api.me());
      } catch {
        setGoogleError(true);
      }
    } else {
      // Promise-Delivery rule: a failed sign-in must say so, visibly.
      if (result.error !== 'cancelled') setGoogleError(true);
    }
  };

  const loadStats = () => {
    api
      .meStats()
      .then(setStats)
      .catch(() => setStats(null));
  };

  useEffect(() => {
    void (async () => {
      if (await isSignedIn()) {
        try {
          setMe(await api.me());
          loadStats();
        } catch {
          await clearSession();
        }
      }
    })();
  }, []);

  // Creator mode + full Passport are Tier 3 — surface a brief "coming soon".
  const comingSoon = () => {
    setNotice(t('prof_comingSoon'));
    setTimeout(() => setNotice(null), 1800);
  };

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
      loadStats();
    } catch {
      // Promise-Delivery rule: a failed verify must say so, visibly.
      setPhase('error-verify');
    }
  };

  const signOut = async () => {
    await clearSession();
    setMe(null);
    setStats(null);
    setPhase('idle');
    setToken('');
  };

  const initial = (me?.displayName ?? me?.email ?? '?').charAt(0).toUpperCase();
  const joined = me
    ? interpolate(t('prof_joined'), {
        date: formatDate(me.joinedAt, { month: 'long', year: 'numeric' }),
      })
    : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      {me ? (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: navClearance }]}>
          {/* Identity hero — avatar (+ verified badge), name, handle · joined, neighbourhood */}
          <View style={styles.hero}>
            <View style={styles.avatar}>
              {me.avatarUrl ? (
                <Image source={{ uri: me.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{initial}</Text>
              )}
              {me.verified ? (
                <View style={styles.verified} accessibilityLabel={t('prof_verified')}>
                  <Check size={12} color={tokens.color.cream} strokeWidth={3} />
                </View>
              ) : null}
            </View>
            <Text style={styles.name}>{me.displayName ?? me.email}</Text>
            <Text style={styles.handle}>
              {me.handle ? `@${me.handle} · ` : ''}
              {joined}
            </Text>
            {me.neighbourhood ? (
              <View style={styles.chip}>
                <MapPin size={12} color={tokens.color.text2} strokeWidth={2} />
                <Text style={styles.chipText}>{me.neighbourhood}</Text>
              </View>
            ) : null}
          </View>

          {/* About */}
          {me.bio ? (
            <>
              <Text style={styles.sectionTitle}>{t('prof_about')}</Text>
              <View style={styles.card}>
                <Text style={styles.bio}>{me.bio}</Text>
              </View>
            </>
          ) : null}

          {/* Creator-mode tile → coming soon */}
          <Pressable style={styles.creatorTile} onPress={comingSoon}>
            <View style={styles.creatorIc}>
              <Sparkles size={18} color={tokens.color.goldDeep} strokeWidth={2} />
            </View>
            <View style={styles.creatorBody}>
              <Text style={styles.creatorTitle}>{t('prof_creatorTitle')}</Text>
              <Text style={styles.creatorSub}>{t('prof_creatorSub')}</Text>
            </View>
            <ChevronRight size={18} color={tokens.color.gray} strokeWidth={2} />
          </Pressable>

          {/* Stats — Attended (past) · Hosted · Bookings (upcoming, taps to list) */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statN}>{stats ? stats.attended : '—'}</Text>
              <Text style={styles.statL}>{t('prof_statAttended')}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statN}>{stats ? stats.hosted : '—'}</Text>
              <Text style={styles.statL}>{t('prof_statHosted')}</Text>
            </View>
            <Pressable style={styles.stat} onPress={() => router.push('/bookings')}>
              <Text style={styles.statN}>{stats ? stats.bookings : '—'}</Text>
              <Text style={styles.statL}>{t('bookings')}</Text>
            </Pressable>
          </View>

          {/* Reputation Passport — honest summary (tier + member-since); full passport is Tier 3 */}
          <Text style={styles.sectionTitle}>{t('prof_passport')}</Text>
          <Pressable style={styles.passport} onPress={comingSoon}>
            <Text style={styles.passportTier}>{tierLabel(me.trustTier)}</Text>
            <Text style={styles.passportMeta}>{joined}</Text>
            <View style={styles.passportView}>
              <Text style={styles.passportViewText}>
                {t('prof_passportView')} · {t('prof_comingSoon')}
              </Text>
              <ChevronRight size={15} color={tokens.color.coralInk} strokeWidth={2} />
            </View>
          </Pressable>

          {/* Programs + sign out */}
          <Pressable style={styles.buttonGhost} onPress={() => router.push('/programs')}>
            <Text style={styles.buttonGhostText}>{t('prog_entry')} →</Text>
          </Pressable>
          <Pressable style={styles.buttonGhost} onPress={signOut}>
            <Text style={styles.buttonGhostText}>{t('signOut')}</Text>
          </Pressable>

          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        </ScrollView>
      ) : (
        <>
          <Text style={styles.heading}>{t('profile')}</Text>
          <View style={styles.card}>
            <Text style={styles.label}>{t('signIn')}</Text>
            <Pressable style={styles.button} onPress={googleSignIn}>
              <Text style={styles.buttonText}>{t('signInWithGoogle')}</Text>
            </Pressable>
            {googleError ? <Text style={styles.error}>{t('verifyFailed')}</Text> : null}

            {/* Dev-only magic-link paste (the stub mailer logs the token). Absent in
                staging/prod builds — Google is the only sign-in there. */}
            {__DEV__ ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="correu@exemple.cat"
                  placeholderTextColor={tokens.color.gray}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <Pressable style={styles.buttonGhost} onPress={requestLink}>
                  <Text style={styles.buttonGhostText}>{t('continueLabel')} (dev)</Text>
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
                    <Pressable style={styles.buttonGhost} onPress={verify}>
                      <Text style={styles.buttonGhostText}>{t('signIn')} (dev)</Text>
                    </Pressable>
                  </>
                ) : null}
                {phase === 'error-verify' ? (
                  <Text style={styles.error}>{t('verifyFailed')}</Text>
                ) : null}
                {phase === 'error-request' ? (
                  <Text style={styles.error}>{t('requestFailed')}</Text>
                ) : null}
              </>
            ) : null}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  heading: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: tokens.color.ink,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },

  // Identity hero
  hero: { alignItems: 'center', gap: 4, paddingTop: 4 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: tokens.color.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 84, height: 84, borderRadius: 42 },
  avatarInitial: { fontFamily: fonts.displaySemi, fontSize: 34, color: tokens.color.cream },
  verified: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.color.forest,
    borderColor: tokens.color.cream,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: fonts.displaySemi, fontSize: 20, color: tokens.color.ink, marginTop: 8 },
  handle: { fontFamily: fonts.body, fontSize: 12.5, color: tokens.color.text2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: tokens.color.forestSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: tokens.color.text2 },

  sectionTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 15,
    color: tokens.color.ink,
    marginTop: 4,
  },
  bio: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: tokens.color.text2 },

  // Creator-mode tile
  creatorTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.color.goldGlow,
    borderColor: tokens.color.goldBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  creatorIc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.color.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorBody: { flex: 1, gap: 2 },
  creatorTitle: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: tokens.color.ink },
  creatorSub: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2 },

  // Stats
  stats: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 2,
  },
  statN: { fontFamily: fonts.displaySemi, fontSize: 22, color: tokens.color.forest },
  statL: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: tokens.color.text2 },

  // Reputation Passport summary
  passport: {
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 2,
  },
  passportTier: { fontFamily: fonts.displaySemi, fontSize: 16, color: tokens.color.goldDeep },
  passportMeta: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2 },
  passportView: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
  passportViewText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: tokens.color.coralInk },

  notice: {
    alignSelf: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: tokens.color.ink,
    backgroundColor: tokens.color.goldGlow,
    borderColor: tokens.color.goldBorder,
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
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
    paddingVertical: 11,
    alignItems: 'center',
  },
  buttonGhostText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: tokens.color.ink },
  hint: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2 },
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
