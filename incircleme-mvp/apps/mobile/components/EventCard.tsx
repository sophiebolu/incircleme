import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { EventListItem } from '@incircleme/types';
import { t, formatPrice, formatDateTime } from '@incircleme/i18n';
import { barrioLabel } from '../lib/onboarding';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600';

export function EventCard({ event }: { event: EventListItem }) {
  const router = useRouter();
  const when = formatDateTime(event.startsAt, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  // Free is a promise, not a blank — say "Gratis", never "—".
  const price = event.priceCents === 0 ? t('ev_free') : formatPrice(event.priceCents, event.currency);

  return (
    <Pressable
      onPress={() => router.push(`/event/${event.id}`)}
      style={styles.card}
      accessibilityRole="button"
    >
      <Image source={{ uri: event.photoUrls[0] ?? FALLBACK_PHOTO }} style={styles.photo} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.meta}>
          {when} · {barrioLabel(event.neighbourhood) || 'Barcelona'} · {price}
        </Text>
        <View style={styles.statusRow}>
          {event.roomFull ? (
            <View style={[styles.statusChip, styles.statusFull]}>
              <Text style={styles.statusFullText}>{t('roomFull')}</Text>
            </View>
          ) : (
            <View style={[styles.statusChip, styles.statusOpen]}>
              <Text style={styles.statusOpenText}>
                {event.seatsLeft} {t('seatsLeft').toLowerCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  photo: { width: 84, height: 84, borderRadius: 10, backgroundColor: tokens.color.border },
  body: { flex: 1, justifyContent: 'center', gap: 4 },
  title: { fontFamily: fonts.displaySemi, fontSize: 15.5, color: tokens.color.ink },
  meta: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2 },
  statusRow: { flexDirection: 'row' },
  statusChip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusOpen: { backgroundColor: tokens.color.forestSoft },
  statusOpenText: { fontFamily: fonts.bodySemi, fontSize: 11, color: tokens.color.forest },
  statusFull: { backgroundColor: tokens.color.coralInk },
  statusFullText: { fontFamily: fonts.bodySemi, fontSize: 11, color: tokens.color.cream },
});
