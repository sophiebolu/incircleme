import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { EventListItem } from '@incircleme/types';
import { t, formatPrice } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600';

export function EventCard({ event }: { event: EventListItem }) {
  const router = useRouter();
  const when = new Date(event.startsAt).toLocaleString('ca-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const price = event.priceCents === 0 ? '—' : formatPrice(event.priceCents, event.currency);

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
          {when} · {event.neighbourhood ?? 'Barcelona'} · {price}
        </Text>
        {event.roomFull ? (
          <Text style={styles.roomFull}>{t('roomFull')}</Text>
        ) : (
          <Text style={styles.seats}>
            {event.seatsLeft} {t('seatsLeft').toLowerCase()}
          </Text>
        )}
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
    padding: 10,
    marginBottom: 10,
  },
  photo: { width: 84, height: 84, borderRadius: 10, backgroundColor: tokens.color.border },
  body: { flex: 1, justifyContent: 'center', gap: 3 },
  title: { fontFamily: fonts.displaySemi, fontSize: 15.5, color: tokens.color.ink },
  meta: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.gray },
  seats: { fontFamily: fonts.bodySemi, fontSize: 12, color: tokens.color.forest },
  roomFull: { fontFamily: fonts.bodySemi, fontSize: 12, color: tokens.color.coralInk },
});
