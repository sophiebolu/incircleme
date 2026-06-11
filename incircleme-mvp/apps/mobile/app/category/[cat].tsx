import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { EventListItem } from '@incircleme/types';
import { t, type StringKey } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { EventCard } from '../../components/EventCard';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const LABEL: Record<string, StringKey> = {
  food_drink: 'catFoodDrink',
  wellness: 'catWellness',
  art_craft: 'catArtCraft',
  music: 'catMusic',
  nature: 'catNature',
  learning: 'catLearning',
};

export default function Category() {
  const { cat } = useLocalSearchParams<{ cat: string }>();
  const router = useRouter();
  const [events, setEvents] = useState<EventListItem[]>([]);

  useEffect(() => {
    api
      .listEvents({ category: cat })
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [cat]);

  const label = LABEL[cat ?? ''] ? t(LABEL[cat!]!) : 'Esdeveniments';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={styles.back}>←</Text>
      </Pressable>
      {/* Category title pattern per vocab lock §4: "{Category} a Barcelona" */}
      <Text style={styles.heading}>{label} a Barcelona</Text>
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
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
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { fontFamily: fonts.body, color: tokens.color.gray },
});
