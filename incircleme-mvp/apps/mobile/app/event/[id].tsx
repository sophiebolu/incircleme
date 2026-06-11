import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { EventDetail } from '@incircleme/types';
import { t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { HostRow } from '../../components/HostRow';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200';

export default function Event() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);

  useEffect(() => {
    if (id) api.getEvent(id).then(setEvent).catch(() => setEvent(null));
  }, [id]);

  if (!event) {
    return <SafeAreaView style={styles.safe} />;
  }

  const when = new Date(event.startsAt).toLocaleString('ca-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const price = event.priceCents === 0 ? '—' : `${(event.priceCents / 100).toFixed(2)} €`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Image source={{ uri: event.photoUrls[0] ?? FALLBACK_PHOTO }} style={styles.hero} />
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.meta}>
          {when} · {event.neighbourhood ?? 'Barcelona'} · {price}
        </Text>

        <View style={styles.section}>
          <HostRow host={event.host} />
        </View>

        {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

        {/* Address stays quiet until T-1 day (locked product rule) */}
        <Text style={styles.address}>
          {event.addressLocked ? "L'adreça s'obre el dia abans." : event.address}
        </Text>

        {event.roomFull ? (
          <View style={[styles.cta, styles.ctaFull]}>
            <Text style={styles.ctaFullText}>{t('roomFull')}</Text>
          </View>
        ) : (
          <Pressable style={styles.cta} onPress={() => router.push(`/book/${event.id}`)}>
            <Text style={styles.ctaText}>{t('bookThisRoom')}</Text>
          </Pressable>
        )}
        <Text style={styles.seatsNote}>
          {event.seatsLeft} {t('seatsLeft').toLowerCase()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  content: { padding: 16, paddingBottom: 40 },
  back: { fontSize: 22, color: tokens.color.ink, marginBottom: 8 },
  hero: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: tokens.color.border,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.4,
    color: tokens.color.ink,
    marginTop: 14,
  },
  meta: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.gray, marginTop: 4 },
  section: { marginTop: 16 },
  description: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: tokens.color.ink,
    marginTop: 16,
  },
  address: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: tokens.color.gray,
    marginTop: 12,
  },
  cta: {
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
  },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.cream },
  ctaFull: { backgroundColor: tokens.color.border },
  ctaFullText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.gray },
  seatsNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: tokens.color.gray,
    textAlign: 'center',
    marginTop: 8,
  },
});
