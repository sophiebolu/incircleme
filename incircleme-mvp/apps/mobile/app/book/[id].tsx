import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { EventDetail } from '@incircleme/types';
import { t } from '@incircleme/i18n';
import { api, ApiError } from '../../lib/api';
import { isSignedIn } from '../../lib/auth';
import { presentPayment } from '../../lib/stripePay';
import { BrandBar } from '../../components/BrandBar';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

type Phase = 'loading' | 'ready' | 'paying' | 'done' | 'roomFull' | 'signedOut' | 'error';

export default function Book() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');

  useEffect(() => {
    (async () => {
      if (!(await isSignedIn())) {
        setPhase('signedOut');
        return;
      }
      if (id) {
        try {
          setEvent(await api.getEvent(id));
          setPhase('ready');
        } catch {
          setPhase('error');
        }
      }
    })();
  }, [id]);

  const pay = async () => {
    if (!id || !event) return;
    setPhase('paying');
    try {
      const result = await api.book(id, 1);
      // Platform-split module: real payment sheet on device, no-op on web (dev render).
      const paid = await presentPayment(result.clientSecret, PUBLISHABLE_KEY);
      if (!paid.ok) throw new Error(paid.error);
      setPhase('done');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'room_full') setPhase('roomFull');
      else if (err instanceof ApiError && err.status === 401) setPhase('signedOut');
      else setPhase('error');
    }
  };

  const price = event ? `${(event.priceCents / 100).toFixed(2)} €` : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={styles.back}>←</Text>
      </Pressable>
      <View style={styles.card}>
        {phase === 'signedOut' ? (
          <Text style={styles.note}>{t('signIn')} — Perfil</Text>
        ) : phase === 'done' ? (
          <>
            <Text style={styles.confirmTitle}>Confirmat</Text>
            <Text style={styles.note}>La sala és teva.</Text>
            <Pressable style={styles.cta} onPress={() => router.replace('/(tabs)/bookings')}>
              <Text style={styles.ctaText}>{t('bookings')}</Text>
            </Pressable>
          </>
        ) : phase === 'roomFull' ? (
          <Text style={styles.confirmTitle}>{t('roomFull')}</Text>
        ) : event ? (
          <>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.price}>Total · {price}</Text>
            <Pressable
              style={[styles.cta, phase === 'paying' && styles.ctaDisabled]}
              disabled={phase === 'paying'}
              onPress={pay}
            >
              <Text style={styles.ctaText}>{phase === 'paying' ? '…' : 'Paga'}</Text>
            </Pressable>
            {phase === 'error' ? <Text style={styles.error}>···</Text> : null}
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  back: { fontSize: 22, color: tokens.color.ink, paddingHorizontal: 16, paddingTop: 8 },
  card: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  title: { fontFamily: fonts.display, fontSize: 19, color: tokens.color.ink },
  price: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.ink },
  cta: {
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.cream },
  confirmTitle: { fontFamily: fonts.display, fontSize: 22, color: tokens.color.forest },
  note: { fontFamily: fonts.body, fontSize: 13.5, color: tokens.color.gray },
  error: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.coralInk },
});
