import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import type { MeResponse, Program } from '@incircleme/types';
import { t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { isSignedIn } from '../../lib/auth';
import { statusColor, statusLabel } from '../../lib/programStatus';
import { BrandBar } from '../../components/BrandBar';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

type Phase = 'loading' | 'ready' | 'signedOut' | 'error';

export default function ProgramsList() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');

  // Refetch on focus so a freshly-submitted Program reflects its new status on return.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!(await isSignedIn())) {
          if (active) setPhase('signedOut');
          return;
        }
        try {
          const [list, profile] = await Promise.all([api.listMyPrograms(), api.me()]);
          if (!active) return;
          setPrograms(list);
          setMe(profile);
          setPhase('ready');
        } catch {
          if (active) setPhase('error');
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const isPremium = me?.hostTier === 'premium';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={styles.back}>←</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.heading}>{t('prog_entry')}</Text>

        {phase === 'signedOut' ? (
          <Text style={styles.note}>{t('signIn')}</Text>
        ) : phase === 'ready' ? (
          <>
            {programs.length === 0 ? (
              <Text style={styles.empty}>{t('prog_empty')}</Text>
            ) : (
              programs.map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.card}
                  onPress={() => router.push(`/programs/${p.id}`)}
                >
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  <View style={[styles.chip, { borderColor: statusColor(p.status) }]}>
                    <Text style={[styles.chipText, { color: statusColor(p.status) }]}>
                      {statusLabel(p.status)}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}

            {!isPremium ? <Text style={styles.note}>{t('prog_premiumOnly')}</Text> : null}
            <Pressable style={styles.cta} onPress={() => router.push('/programs/new')}>
              <Text style={styles.ctaText}>{t('prog_submitNew')}</Text>
            </Pressable>
          </>
        ) : phase === 'error' ? (
          <Text style={styles.note}>···</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  back: { fontSize: 22, color: tokens.color.ink, paddingHorizontal: 16, paddingTop: 8 },
  body: { padding: 16, gap: 12 },
  heading: { fontFamily: fonts.display, fontSize: 24, color: tokens.color.ink, marginBottom: 2 },
  // text2 (not gray): empty/premium notes must clear WCAG AA — gray was ~2.5:1 on cream.
  empty: { fontFamily: fonts.body, fontSize: 14, color: tokens.color.text2, paddingVertical: 8 },
  note: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.text2 },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: { fontFamily: fonts.displaySemi, fontSize: 16, color: tokens.color.ink, flexShrink: 1 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 11.5 },
  cta: {
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.cream },
});
