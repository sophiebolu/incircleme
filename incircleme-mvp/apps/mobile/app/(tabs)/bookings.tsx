import { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarHeart, ChevronRight, Compass, MessageCircle, Star } from 'lucide-react-native';
import type { BookingListItem } from '@incircleme/types';
import { formatDateTime, interpolate, t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { isSignedIn } from '../../lib/auth';
import { BrandBar } from '../../components/BrandBar';
import { useNavClearance } from '../../lib/useNavClearance';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

type Tab = 'upcoming' | 'past' | 'cancelled';
const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=480';

const statusLabel = (s: string): string => {
  switch (s) {
    case 'held':
      return t('bookStatusHeld');
    case 'confirmed':
      return t('bookStatusConfirmed');
    case 'cancelled':
      return t('bookStatusCancelled');
    case 'refunded':
      return t('bookStatusRefunded');
    default:
      return s;
  }
};

// Client-side bucketing: cancelled/refunded → Cancelled; ended → Past; else Upcoming.
const bucketOf = (b: BookingListItem, now: number): Tab => {
  if (b.status === 'cancelled' || b.status === 'refunded') return 'cancelled';
  if (new Date(b.event.endsAt).getTime() < now) return 'past';
  return 'upcoming';
};

export default function Bookings() {
  const router = useRouter();
  const [items, setItems] = useState<BookingListItem[] | null>(null);
  const [signedIn, setSignedIn] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');
  const navClearance = useNavClearance();

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void (async () => {
        if (!(await isSignedIn())) {
          if (live) setSignedIn(false);
          return;
        }
        try {
          const data = await api.myBookings();
          if (live) {
            setSignedIn(true);
            setItems(data);
          }
        } catch {
          if (live) setItems([]);
        }
      })();
      return () => {
        live = false;
      };
    }, []),
  );

  const { buckets, counts } = useMemo(() => {
    const now = Date.now();
    const b: Record<Tab, BookingListItem[]> = { upcoming: [], past: [], cancelled: [] };
    for (const it of items ?? []) b[bucketOf(it, now)].push(it);
    return {
      buckets: b,
      counts: { upcoming: b.upcoming.length, past: b.past.length, cancelled: b.cancelled.length },
    };
  }, [items]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'upcoming', label: t('bk_tabUpcoming') },
    { key: 'past', label: t('bk_tabPast') },
    { key: 'cancelled', label: t('bk_tabCancelled') },
  ];

  // Empty-state title: italic on the lead clause (before " — "), per §13b.
  const [emptyLead, emptyRest] = t('bk_emptyTitle').split(' — ');

  const renderCard = ({ item }: { item: BookingListItem }) => {
    const meta = formatDateTime(item.event.startsAt, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    // A confirmed, not-yet-ended booking opens its ticket; everything else
    // (held/past/cancelled/refunded) keeps routing to the event detail.
    const isLiveTicket =
      item.status === 'confirmed' && new Date(item.event.endsAt).getTime() >= Date.now();
    const onPress = () =>
      router.push(isLiveTicket ? `/ticket/${item.id}` : `/event/${item.event.id}`);
    return (
      <Pressable style={styles.card} onPress={onPress}>
        <Image source={{ uri: item.event.photoUrls[0] ?? FALLBACK_PHOTO }} style={styles.thumb} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.event.title}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {meta} · {item.event.neighbourhood ?? 'Barcelona'}
          </Text>
          <View style={styles.chips}>
            <View style={[styles.chip, item.status === 'confirmed' && styles.chipOk]}>
              <Text style={[styles.chipText, item.status === 'confirmed' && styles.chipTextOk]}>
                {statusLabel(item.status)}
              </Text>
            </View>
            {item.circleId ? (
              <Pressable
                style={[styles.chip, styles.chipCircle]}
                onPress={() => router.push(`/circle/${item.circleId}`)}
              >
                <MessageCircle size={11} color={tokens.color.forest} strokeWidth={2} />
                <Text style={styles.chipCircleText}>
                  {interpolate(t('bk_circleChip'), { n: String(item.circleMemberCount ?? 0) })}
                </Text>
              </Pressable>
            ) : null}
            {/* Past attended booking → invite a review */}
            {item.status === 'confirmed' &&
            new Date(item.event.endsAt).getTime() < Date.now() ? (
              <Pressable
                style={[styles.chip, styles.chipReview]}
                onPress={() => router.push(`/review/${item.id}`)}
              >
                <Star size={11} color={tokens.color.coralInk} strokeWidth={2} />
                <Text style={styles.chipReviewText}>{t('bk_leaveReview')}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        <ChevronRight size={18} color={tokens.color.gray} strokeWidth={2} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <Text style={styles.heading}>{t('bookings')}</Text>

      {!signedIn ? (
        <Text style={styles.signedOut}>
          {t('signIn')} — {t('profile')}
        </Text>
      ) : (
        <>
          <View style={styles.tabs}>
            {TABS.map(({ key, label }) => (
              <Pressable
                key={key}
                style={[styles.tab, tab === key && styles.tabOn]}
                onPress={() => setTab(key)}
              >
                <Text style={[styles.tabText, tab === key && styles.tabTextOn]}>
                  {label} {counts[key]}
                </Text>
              </Pressable>
            ))}
          </View>

          <FlatList
            data={buckets[tab]}
            keyExtractor={(b) => b.id}
            contentContainerStyle={[styles.list, { paddingBottom: navClearance }]}
            renderItem={renderCard}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIc}>
                  <CalendarHeart size={26} color={tokens.color.coralInk} strokeWidth={1.8} />
                </View>
                <Text style={styles.emptyTitle}>
                  <Text style={styles.emptyTitleEm}>{emptyLead}</Text>
                  {emptyRest ? ` — ${emptyRest}` : ''}
                </Text>
                <Text style={styles.emptySub}>{t('bk_emptySub')}</Text>
                <Pressable style={styles.emptyCta} onPress={() => router.push('/')}>
                  <Compass size={15} color={tokens.color.cream} strokeWidth={2} />
                  <Text style={styles.emptyCtaText}>{t('bk_emptyCta')}</Text>
                </Pressable>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  heading: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: tokens.color.ink,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  signedOut: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.text2, paddingHorizontal: 16 },

  // Tabs
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  tab: {
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabOn: { backgroundColor: tokens.color.forest, borderColor: tokens.color.forest },
  tabText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: tokens.color.text2 },
  tabTextOn: { color: tokens.color.cream },

  // List + cards
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: tokens.color.border },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontFamily: fonts.displaySemi, fontSize: 15, color: tokens.color.ink },
  cardMeta: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  chip: {
    backgroundColor: tokens.color.cream,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.4, color: tokens.color.text2 },
  chipOk: { backgroundColor: tokens.color.forestSoft, borderColor: tokens.color.forestSoft },
  chipTextOk: { color: tokens.color.forest },
  chipCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.color.forestSoft,
    borderColor: tokens.color.forestSoft,
  },
  chipCircleText: { fontFamily: fonts.bodySemi, fontSize: 10, color: tokens.color.forest },
  chipReview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.color.goldGlow,
    borderColor: tokens.color.goldBorder,
  },
  chipReviewText: { fontFamily: fonts.bodySemi, fontSize: 10, color: tokens.color.coralInk },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24, gap: 8 },
  emptyIc: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.color.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: fonts.display, fontSize: 19, color: tokens.color.ink, textAlign: 'center' },
  emptyTitleEm: { fontFamily: fonts.displayItalic, color: tokens.color.coralInk },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.text2, textAlign: 'center' },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  emptyCtaText: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.cream },
});
