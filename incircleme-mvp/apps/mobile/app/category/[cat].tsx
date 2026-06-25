import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { EventListItem } from '@incircleme/types';
import { t, interpolate, type StringKey } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { EventCard } from '../../components/EventCard';
import { BrandBar } from '../../components/BrandBar';
import { barrioLabel } from '../../lib/onboarding';
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

// Spec filter pills (single-select). Date/price filters run client-side over the
// upcoming set, so no API change is needed.
type Filter = 'all' | 'weekend' | 'weekday' | 'free' | 'paid';
const FILTERS: { key: Filter; label: StringKey }[] = [
  { key: 'all', label: 'fil_all' },
  { key: 'weekend', label: 'fil_weekend' },
  { key: 'weekday', label: 'fil_weekday' },
  { key: 'free', label: 'fil_free' },
  { key: 'paid', label: 'fil_paid' },
];

function matchesFilter(e: EventListItem, f: Filter): boolean {
  if (f === 'free') return e.priceCents === 0;
  if (f === 'paid') return e.priceCents > 0;
  if (f === 'weekend' || f === 'weekday') {
    const day = new Date(e.startsAt).getDay(); // 0 Sun … 6 Sat
    const isWeekend = day === 0 || day === 6;
    return f === 'weekend' ? isWeekend : !isWeekend;
  }
  return true; // all
}

export default function Category() {
  const { cat } = useLocalSearchParams<{ cat: string }>();
  const router = useRouter();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [barri, setBarri] = useState<string | null>(null);
  const [allBarrios, setAllBarrios] = useState<string[]>([]);
  const navClearance = useNavClearance();

  useEffect(() => {
    api
      .listEvents({
        ...(cat && cat !== 'all' ? { category: cat } : {}),
        ...(barri ? { neighbourhood: barri } : {}),
        dateFrom: new Date().toISOString(), // upcoming only — never surface past events
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
  }, [cat, barri]);

  const label = LABEL[cat ?? ''] ? t(LABEL[cat!]!) : t('catAll');
  const shown = events.filter((e) => matchesFilter(e, filter));
  const resetFilters = () => {
    setFilter('all');
    setBarri(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
        <Text style={styles.back}>←</Text>
      </Pressable>
      {/* Category title pattern per vocab lock §4 — locale-aware connector */}
      <Text style={styles.heading}>{interpolate(t('inBarcelona'), { cat: label })}</Text>

      {/* Filter pills (spec): All · Weekend · Weekday · Free · Paid. Barri chips follow as a
          secondary, data-driven group (single-select each). */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map(({ key, label: l }) => (
          <Pressable
            key={key}
            style={[styles.chip, filter === key && styles.chipOn]}
            onPress={() => setFilter(key)}
            hitSlop={{ top: 8, bottom: 8 }}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === key }}
          >
            <Text style={[styles.chipText, filter === key && styles.chipTextOn]}>{t(l)}</Text>
          </Pressable>
        ))}
        {allBarrios.length > 0 ? <View style={styles.sep} /> : null}
        {allBarrios.length > 0 ? (
          <Pressable
            style={[styles.chip, barri === null && styles.chipOn]}
            onPress={() => setBarri(null)}
            hitSlop={{ top: 8, bottom: 8 }}
            accessibilityRole="button"
            accessibilityState={{ selected: barri === null }}
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
            hitSlop={{ top: 8, bottom: 8 }}
            accessibilityRole="button"
            accessibilityState={{ selected: barri === b }}
          >
            <Text style={[styles.chipText, barri === b && styles.chipTextOn]}>{barrioLabel(b)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Never blank: real rows when events exist, a warm + specific empty state otherwise. */}
      <FlatList
        data={shown}
        keyExtractor={(e) => e.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: navClearance },
          shown.length === 0 && styles.listEmpty,
        ]}
        renderItem={({ item }) => <EventCard event={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('cat_emptyTitle')}</Text>
            <Text style={styles.emptySub}>{t('cat_emptySub')}</Text>
            <Pressable style={styles.emptyCta} onPress={resetFilters} accessibilityRole="button">
              <Text style={styles.emptyCtaText}>{t('cat_emptyCta')}</Text>
            </Pressable>
          </View>
        }
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
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 8 },
  emptyTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 17,
    color: tokens.color.ink,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: tokens.color.text2,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 8,
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: 'center',
  },
  emptyCtaText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: tokens.color.cream },
});
