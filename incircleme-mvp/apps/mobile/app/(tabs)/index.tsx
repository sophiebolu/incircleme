import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import type { EventListItem } from '@incircleme/types';
import { t, interpolate } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { isSignedIn } from '../../lib/auth';
import { BrandBar } from '../../components/BrandBar';
import { TonightAdSlot, pickSlides } from '../../components/TonightAdSlot';
import { SearchBar } from '../../components/SearchBar';
import { SectionEyebrow } from '../../components/SectionEyebrow';
import { CategoryGrid } from '../../components/CategoryGrid';
import { ProgramsStrip } from '../../components/ProgramsStrip';
import { useNavClearance } from '../../lib/useNavClearance';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function Home() {
  const router = useRouter();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [name, setName] = useState('Marta'); // prototype demo persona until signed in
  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);
  const navClearance = useNavClearance();

  // Unread badge — refetched whenever Home regains focus (so it clears after the inbox opens).
  const refreshUnread = useCallback(async () => {
    try {
      setUnread((await api.unreadCount()).count);
    } catch {
      // signed-out / network — leave the badge as-is
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void refreshUnread();
    }, [refreshUnread]),
  );

  const load = useCallback(async () => {
    // Onboarding gate (sign-in FIRST): no session → the welcome front door; signed in but
    // not yet onboarded → resume the flow; onboarded → straight to Home.
    let mine: Awaited<ReturnType<typeof api.me>> | null = null;
    try {
      if (!(await isSignedIn())) {
        router.replace('/onboarding/welcome');
        return;
      }
      mine = await api.me();
      if (!mine.onboardingCompleted) {
        router.replace('/onboarding/intent');
        return;
      }
      if (mine.displayName) setName(mine.displayName);
    } catch {
      // network hiccup on /me — stay on Home rather than bounce the user out
    }
    try {
      const list = await api.listEvents();
      // Shape the feed by the attendee's picked interests (== EventCategory): matching
      // categories float to the top, order otherwise preserved. Honest, not faked.
      const interests = new Set(mine?.interests ?? []);
      setEvents(
        interests.size
          ? [...list].sort(
              (a, b) => Number(interests.has(b.category)) - Number(interests.has(a.category)),
            )
          : list,
      );
    } catch {
      // keep last data; Home stays calm on network errors
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const weekCount = events.filter(
    (e) => new Date(e.startsAt).getTime() - Date.now() < WEEK_MS,
  ).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar bell unread={unread} onBell={() => router.push('/notifications')} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: navClearance }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Home hero — locked §18; em = italic coral-ink on the meaning-bearer */}
        <View style={styles.hero}>
          <Text style={styles.greet}>
            {t('homeGreetingPrefix')}
            <Text style={styles.greetEm}>{name}</Text>.
          </Text>
          <Text style={styles.sub}>
            <Text style={styles.subEm}>
              {interpolate(t('homeSubEm'), { count: String(weekCount) })}
            </Text>
            {t('homeSubRest')}
          </Text>
        </View>

        {/* Search — readonly bar, routes to the events feed */}
        <SearchBar />

        {/* 1. Tonight rotating ad-slot */}
        <TonightAdSlot slides={pickSlides(events, 'Gràcia')} />

        {/* 2. Types of events (locked §13b) — gold-pill eyebrow per prototype */}
        <SectionEyebrow label={t('typesOfEvents')} />
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
  // Prototype .home-hero (home-scoped): margin 2 0 8, padding 0 2
  hero: { marginTop: 2, marginBottom: 8, paddingHorizontal: 2 },
  greet: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 28.5,
    letterSpacing: -0.65,
    color: tokens.color.ink,
  },
  greetEm: {
    fontFamily: fonts.displayItalic,
    color: tokens.color.coralInk,
  },
  sub: {
    fontFamily: fonts.display,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.07,
    color: tokens.color.text2,
    marginTop: 3,
  },
  subEm: {
    fontFamily: fonts.displayItalic,
    color: tokens.color.coralInk,
  },
  programs: { marginTop: 22 },
});
