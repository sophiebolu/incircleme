import { useEffect, useRef, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { EventListItem } from '@incircleme/types';
import { t, formatPrice } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

const ROTATE_MS = 5000;
const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200';

export interface AdSlide {
  event: EventListItem;
  /** Locked eyebrow key (vocab lock §17). */
  eyebrow: 'adTonightsPick' | 'adBookedByNeighbours' | 'adSixWeekRitual';
}

/** Picks ≤5 slides: highest booking momentum first (seats booked / capacity), then soonest. */
export function pickSlides(events: EventListItem[], neighbourhood?: string | null): AdSlide[] {
  let pool = neighbourhood ? events.filter((e) => e.neighbourhood === neighbourhood) : events;
  if (pool.length === 0) pool = events; // Barcelona-wide fallback
  const ranked = [...pool].sort((a, b) => {
    const va = a.seatsBooked / Math.max(1, a.seatCount);
    const vb = b.seatsBooked / Math.max(1, b.seatCount);
    if (vb !== va) return vb - va;
    return a.startsAt.localeCompare(b.startsAt);
  });
  return ranked.slice(0, 5).map((event, i) => ({
    event,
    eyebrow: i === 0 ? 'adTonightsPick' : 'adBookedByNeighbours',
  }));
}

/** Fraunces title with the last word italic + coral-soft (the prototype's <em> treatment). */
function AdTitle({ title }: { title: string }) {
  const words = title.split(' ');
  const em = words.length > 1 ? words.pop()! : null;
  return (
    <Text style={styles.title} numberOfLines={2}>
      {words.join(' ')}
      {em ? ' ' : ''}
      {em ? <Text style={styles.titleEm}>{em}</Text> : null}
    </Text>
  );
}

export function TonightAdSlot({ slides }: { slides: AdSlide[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (slides.length < 2) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[Math.min(index, slides.length - 1)]!;
  const e = slide.event;

  const when = new Date(e.startsAt).toLocaleTimeString('ca-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const price = e.priceCents === 0 ? '—' : formatPrice(e.priceCents, e.currency);

  const onDot = (i: number) => {
    setIndex(i); // manual nav resets the cadence
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = setInterval(() => setIndex((x) => (x + 1) % slides.length), ROTATE_MS);
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/event/${e.id}`)}
      style={styles.slot}
      accessibilityRole="button"
      accessibilityLabel={e.title}
    >
      <ImageBackground
        source={{ uri: e.photoUrls[0] ?? FALLBACK_PHOTO }}
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        <View style={styles.scrim} />
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>{t(slide.eyebrow).toUpperCase()}</Text>
        </View>
        <View style={styles.body}>
          <AdTitle title={e.title} />
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{when}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.meta}>{e.neighbourhood ?? 'Barcelona'}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.meta}>{price}</Text>
          </View>
        </View>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => onDot(i)}
              hitSlop={8}
              style={[styles.dot, i === index && styles.dotOn]}
            />
          ))}
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    aspectRatio: 21 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    // Prototype home-scoped .ad-slot margin: 6px 0 4px
    marginTop: 6,
    marginBottom: 4,
    backgroundColor: tokens.color.border,
  },
  bg: { flex: 1, justifyContent: 'flex-end' },
  bgImage: { resizeMode: 'cover' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,28,30,0.30)',
  },
  eyebrow: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(247,243,237,0.92)',
    borderColor: 'rgba(212,130,90,0.22)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  eyebrowText: {
    color: tokens.color.coralInk,
    fontFamily: fonts.bodyHeavy,
    fontSize: 9.5,
    letterSpacing: 1.2,
  },
  body: { padding: 14, paddingBottom: 18 },
  title: {
    fontFamily: fonts.display,
    fontSize: 21,
    lineHeight: 23.5,
    letterSpacing: -0.4,
    color: tokens.color.cream,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 1 },
  },
  titleEm: {
    fontFamily: fonts.displayItalic,
    color: tokens.color.coralSoft,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 6 },
  meta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.2,
    color: tokens.color.cream,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 6,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(247,243,237,0.7)',
  },
  dots: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(247,243,237,0.45)',
  },
  dotOn: {
    width: 18,
    borderRadius: 3,
    backgroundColor: tokens.color.cream,
  },
});
