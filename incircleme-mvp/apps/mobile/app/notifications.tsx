import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CalendarX2, CheckCircle2, RotateCcw, XCircle } from 'lucide-react-native';
import type { Notification, NotificationType } from '@incircleme/types';
import { interpolate, t } from '@incircleme/i18n';
import { api } from '../lib/api';
import { BrandBar } from '../components/BrandBar';
import { ErrorRetry, ScreenSkeleton } from '../components/ScreenStates';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

type Status = 'loading' | 'ready' | 'error';

const COPY_KEY = {
  booking_confirmed: 'notif_bookingConfirmed',
  booking_cancelled: 'notif_bookingCancelled',
  booking_refunded: 'notif_bookingRefunded',
  host_cancelled: 'notif_hostCancelled',
} as const;

const euros = (cents: number | null): string => (cents == null ? '' : String(Math.round(cents / 100)));

/** Compact relative time (m/h/d are near-universal abbreviations across CA/ES/EN). */
function relativeTime(iso: string, now: number): string {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return '·';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

function TypeIcon({ type }: { type: NotificationType }) {
  const size = 19;
  const sw = 2.2;
  if (type === 'booking_confirmed')
    return <CheckCircle2 size={size} color={tokens.color.forest} strokeWidth={sw} />;
  if (type === 'booking_refunded')
    return <RotateCcw size={size} color={tokens.color.forest} strokeWidth={sw} />;
  if (type === 'host_cancelled')
    return <CalendarX2 size={size} color={tokens.color.coralInk} strokeWidth={sw} />;
  return <XCircle size={size} color={tokens.color.text2} strokeWidth={sw} />;
}

export default function Notifications() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const list = await api.notifications();
      setItems(list);
      setStatus('ready');
      // Mark-on-open: clear unread once the inbox is seen (badge clears on Home return).
      if (list.some((n) => !n.readAt)) void api.markAllNotificationsRead().catch(() => {});
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const now = Date.now();

  const header = (
    <>
      <BrandBar />
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
          <Text style={styles.back}>←</Text>
        </Pressable>
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
          <Text style={styles.emptyTitle}>{t('notif_emptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('notif_emptyBody')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((n) => {
            const body = interpolate(t(COPY_KEY[n.type]), {
              event: n.eventTitle ?? '',
              amount: euros(n.amountCents),
            });
            return (
              <Pressable
                key={n.id}
                style={styles.row}
                onPress={() => n.bookingId && router.push(`/ticket/${n.bookingId}`)}
                accessibilityRole="button"
                accessibilityLabel={body}
              >
                <View style={styles.icon}>
                  <TypeIcon type={n.type} />
                </View>
                <Text style={[styles.body, !n.readAt && styles.bodyUnread]} numberOfLines={3}>
                  {body}
                </Text>
                <Text style={styles.time}>{relativeTime(n.createdAt, now)}</Text>
                {!n.readAt ? <View style={styles.dot} /> : null}
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
  appbar: { paddingHorizontal: 18, paddingBottom: 6 },
  back: { fontSize: 24, color: tokens.color.ink, lineHeight: 28 },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
  },
  icon: { width: 28, alignItems: 'center' },
  body: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 20, color: tokens.color.forest },
  bodyUnread: { fontFamily: fonts.bodyMedium, color: tokens.color.ink },
  time: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.color.coralInk },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 8 },
  emptyTitle: { fontFamily: fonts.displaySemi, fontSize: 19, color: tokens.color.ink, textAlign: 'center' },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: tokens.color.text2,
    textAlign: 'center',
  },
});
