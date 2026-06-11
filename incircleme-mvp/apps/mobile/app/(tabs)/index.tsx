import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { EventListItem } from '@incircleme/types';
import { t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { TonightAdSlot, pickSlides } from '../../components/TonightAdSlot';
import { CategoryGrid } from '../../components/CategoryGrid';
import { ProgramsStrip } from '../../components/ProgramsStrip';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

export default function Home() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEvents(await api.listEvents());
      setError(null);
    } catch {
      setError('api');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Editorial greeting — Fraunces, CA-first */}
        <Text style={styles.greeting}>Bona tarda</Text>
        <Text style={styles.sub}>Gràcia · Barcelona</Text>

        {/* 1. Tonight rotating ad-slot */}
        <TonightAdSlot slides={pickSlides(events, 'Gràcia')} />
        {error ? <Text style={styles.error}>—</Text> : null}

        {/* 2. Types of events (locked §13b) */}
        <Text style={styles.eyebrow}>{t('typesOfEvents')}</Text>
        <CategoryGrid />

        {/* 3. Programs strip (presentational until Slice 5) */}
        <View style={styles.programs}>
          <ProgramsStrip />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  content: { padding: 16, paddingBottom: 32 },
  greeting: {
    fontFamily: fonts.display,
    fontSize: 27,
    letterSpacing: -0.5,
    color: tokens.color.ink,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: tokens.color.gray,
    marginTop: 2,
    marginBottom: 12,
  },
  eyebrow: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: tokens.color.coralInk,
    marginTop: 18,
    marginBottom: 10,
  },
  programs: { marginTop: 22 },
  error: { color: tokens.color.gray },
});
