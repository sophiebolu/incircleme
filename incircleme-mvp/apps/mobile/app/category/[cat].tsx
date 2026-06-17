import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { EventListItem } from '@incircleme/types';
import { t, interpolate, type StringKey } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { EventCard } from '../../components/EventCard';
import { BrandBar } from '../../components/BrandBar';
import { useNavClearance } from '../../lib/useNavClearance';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const LABEL: Record<string, StringKey> = {
  food_drink: 'catFoodDrink',
  all: 'catAll',
  wellness: 'catWellness',
  art_craft: 'catArtCraft',
  music: 'catMusic',
  nature: 'catNature',
  learning: 'catLearning',
};

type When = 'anytime' | 'thisWeek' | 'weekend';
const WHEN_KEYS: { key: When; label: StringKey }[] = [
  { key: 'anytime', label: 'fil_anytime' },
  { key: 'thisWeek', label: 'fil_thisWeek' },
  { key: 'weekend', label: 'fil_weekend' },
];

// When-chips → date window on the existing /events query. "Anytime" is upcoming-
// only (dateFrom = now) so the discovery feed never shows past events.
function whenRange(when: When): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  if (when === 'thisWeek') {
    const to = new Date(now);
    to.setDate(to.getDate() + 7);
    return { dateFrom: now.toISOString(), dateTo: to.toISOString() };
  }
  if (when === 'weekend') {
    const day = now.getDay(); // 0 Sun … 6 Sat
    const sat = new Date(now);
    sat.setHours(0, 0, 0, 0);
    sat.setDate(sat.getDate() + (day === 0 ? -1 : 6 - day)); // nearest weekend's Saturday
    const sunEnd = new Date(sat);
    sunEnd.setDate(sunEnd.getDate() + 1);
    sunEnd.setHours(23, 59, 59, 999);
    const from = sat.getTime() < now.getTime() ? now : sat; // never reach into the past
    return { dateFrom: from.toISOString(), dateTo: sunEnd.toISOString() };
  }
  return { dateFrom: now.toISOString() }; // anytime = upcoming only
}

export default function Category() {
  const { cat } = useLocalSearchParams<{ cat: string }>();
  const router = useRouter();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [when, setWhen] = useState<When>('anytime');
  const [barri, setBarri] = useState<string | null>(null);
  const [allBarrios, setAllBarrios] = useState<string[]>([]);
  const navClearance = useNavClearance();

  useEffect(() => {
    const range = whenRange(when);
    api
      .listEvents({
        ...(cat && cat !== 'all' ? { category: cat } : {}),
        ...(barri ? { neighbourhood: barri } : {}),
        ...range,
      })
      .then((rows) => {
        setEvents(rows);
        // Barri chip options come from the unfiltered-by-barri set, so the list stays stable.
        if (!barri) {
          const seen = [...new Set(rows.map((e) => e.neighbourhood).filter(Boolean))] as string[];
          setAllBarrios(seen.sort((a, b) => a.localeCompare(b)));
        }
      })
      .catch(() => setEvents([]));
  }, [cat, when, barri]);

  const label = LABEL[cat ?? ''] ? t(LABEL[cat!]!) : t('catAll');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={styles.back}>←</Text>
      </Pressable>
      {/* Category title pattern per vocab lock §4 — locale-aware connector */}
      <Text style={styles.heading}>{interpolate(t('inBarcelona'), { cat: label })}</Text>

      {/* Filter row — when chips · barri chips (single-select each, re-queries on change) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {WHEN_KEYS.map(({ key, label: l }) => (
          <Pressable
            key={key}
            style={[styles.chip, when === key && styles.chipOn]}
            onPress={() => setWhen(key)}
          >
            <Text style={[styles.chipText, when === key && styles.chipTextOn]}>{t(l)}</Text>
          </Pressable>
        ))}
        {allBarrios.length > 0 ? <View style={styles.sep} /> : null}
        {allBarrios.length > 0 ? (
          <Pressable
            style={[styles.chip, barri === null && styles.chipOn]}
            onPress={() => setBarri(null)}
          >
            <Text style={[styles.chipText, barri === null && styles.chipTextOn]}>
              {t('fil_allBarrios')}
            </Text>
          </Pressable>
        ) : null}
        {allBarrios.map((b) => (
          <Pressable
            key={b}
            style={[styles.chip, barri === b && styles.chipOn]}
            onPress={() => setBarri(b)}
          >
            <Text style={[styles.chipText, barri === b && styles.chipTextOn]}>{b}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={[styles.list, { paddingBottom: navClearance }]}
        renderItem={({ item }) => <EventCard event={item} />}
        ListEmptyComponent={<Text style={styles.empty}>—</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  back: { fontSize: 22, color: tokens.color.ink, paddingHorizontal: 16, paddingTop: 8 },
  heading: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: tokens.color.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filters: { paddingHorizontal: 16, paddingBottom: 12, gap: 8, alignItems: 'center' },
  chip: {
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipOn: { backgroundColor: tokens.color.forest, borderColor: tokens.color.forest },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: tokens.color.text2 },
  chipTextOn: { color: tokens.color.cream },
  sep: { width: 1, height: 22, backgroundColor: tokens.color.border, marginHorizontal: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { fontFamily: fonts.body, color: tokens.color.text2 },
});
