import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarCheck, ChevronRight } from 'lucide-react-native';
import type { HostedEventSummary } from '@incircleme/types';
import { formatDate, interpolate, t } from '@incircleme/i18n';
import { api } from '../lib/api';
import { BrandBar } from '../components/BrandBar';
import { ErrorRetry, ScreenSkeleton } from '../components/ScreenStates';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

type Status = 'loading' | 'ready' | 'error';

const STATUS_STYLE: Record<HostedEventSummary['status'], { box: object; text: object; key: 'ck_statusUpcoming' | 'ck_statusPast' | 'ck_statusCancelled' }> = {
  upcoming: { box: { backgroundColor: tokens.color.forestSoft }, text: { color: tokens.color.forest }, key: 'ck_statusUpcoming' },
  past: { box: { backgroundColor: tokens.color.bg2, borderWidth: 1, borderColor: tokens.color.border }, text: { color: tokens.color.text2 }, key: 'ck_statusPast' },
  cancelled: { box: { backgroundColor: tokens.color.bg2, borderWidth: 1, borderColor: tokens.color.border }, text: { color: tokens.color.coralInk }, key: 'ck_statusCancelled' },
};

export default function HostedEvents() {
  const router = useRouter();
  const [items, setItems] = useState<HostedEventSummary[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setItems(await api.hostedEvents());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  // Refresh counts when returning from a roster (a check-in there bumps checkedInCount).
  useFocusEffect(useCallback(() => void load(), [load]));

  const header = (
    <>
      <BrandBar />
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>{t('ck_hostedTitle')}</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {header}
      {status === 'loading' ? (
        <ScreenSkeleton />
      ) : status === 'error' ? (
        <ErrorRetry onRetry={load} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('ck_hostedEmptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('ck_hostedEmptyBody')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((e) => {
            const ss = STATUS_STYLE[e.status];
            return (
              <Pressable
                key={e.id}
                style={styles.row}
                onPress={() =>
                  router.push({ pathname: '/event-checkin/[eventId]', params: { eventId: e.id, title: e.title } })
                }
                accessibilityRole="button"
                accessibilityLabel={e.title}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {e.title}
                  </Text>
                  <Text style={styles.meta}>
                    {formatDate(e.startsAt, { day: 'numeric', month: 'long' })}
                  </Text>
                  <View style={styles.countRow}>
                    <CalendarCheck size={14} color={tokens.color.forest} strokeWidth={2} />
                    <Text style={styles.count}>
                      {interpolate(t('ck_countSummary'), {
                        checked: String(e.checkedInCount),
                        total: String(e.confirmedCount),
                      })}
                    </Text>
                    <View style={[styles.badge, ss.box]}>
                      <Text style={[styles.badgeText, ss.text]}>{t(ss.key)}</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color={tokens.color.text2} strokeWidth={2} />
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  appbar: { paddingHorizontal: 18, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { fontSize: 24, color: tokens.color.ink, lineHeight: 28 },
  title: { fontFamily: fonts.displaySemi, fontSize: 20, color: tokens.color.ink },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
  },
  rowMain: { flex: 1, gap: 4 },
  eventTitle: { fontFamily: fonts.bodySemi, fontSize: 15.5, color: tokens.color.ink },
  meta: { fontFamily: fonts.body, fontSize: 12.5, color: tokens.color.text2 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  count: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: tokens.color.forest },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4 },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 10.5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 8 },
  emptyTitle: { fontFamily: fonts.displaySemi, fontSize: 19, color: tokens.color.ink, textAlign: 'center' },
  emptyBody: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: tokens.color.text2, textAlign: 'center' },
});
