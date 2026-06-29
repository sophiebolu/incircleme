import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import type { EventAttendee } from '@incircleme/types';
import { interpolate, t } from '@incircleme/i18n';
import { api, ApiError } from '../../lib/api';
import { mapCheckInOutcome, type CheckInOutcome } from '../../lib/checkInOutcome';
import { BrandBar } from '../../components/BrandBar';
import { ErrorRetry, ScreenSkeleton } from '../../components/ScreenStates';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

type Status = 'loading' | 'ready' | 'error';

const initial = (name: string | null): string => (name?.trim()?.[0] ?? '·').toUpperCase();

export default function EventCheckin() {
  const router = useRouter();
  const { eventId, title } = useLocalSearchParams<{ eventId: string; title?: string }>();
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [pendingId, setPendingId] = useState<string | null>(null); // row awaiting inline confirm
  const [busyId, setBusyId] = useState<string | null>(null); // row whose check-in is in flight
  const [notice, setNotice] = useState<CheckInOutcome | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setAttendees(await api.eventAttendees(eventId));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  const flash = useCallback((o: CheckInOutcome) => {
    setNotice(o);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2600);
  }, []);

  const { checkedCount, total } = useMemo(
    () => ({ checkedCount: attendees.filter((a) => a.checkedInAt).length, total: attendees.length }),
    [attendees],
  );

  const confirmCheckIn = useCallback(
    async (a: EventAttendee) => {
      setPendingId(null);
      setBusyId(a.bookingId);
      const stamp = new Date().toISOString();
      // Optimistic: show them checked in immediately; roll back if the server rejects.
      setAttendees((prev) => prev.map((x) => (x.bookingId === a.bookingId ? { ...x, checkedInAt: stamp } : x)));
      try {
        await api.checkIn(eventId, a.bookingId);
        flash(mapCheckInOutcome({ ok: true, alreadyCheckedIn: false }));
      } catch (err) {
        // Roll back the optimistic tick, then surface the mapped outcome.
        setAttendees((prev) => prev.map((x) => (x.bookingId === a.bookingId ? { ...x, checkedInAt: null } : x)));
        flash(
          mapCheckInOutcome(
            err instanceof ApiError
              ? { ok: false, status: err.status, code: err.code }
              : { ok: false, status: 0, code: 'network' },
          ),
        );
      } finally {
        setBusyId(null);
      }
    },
    [eventId, flash],
  );

  const header = (
    <>
      <BrandBar />
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
          <Text style={styles.back}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {status === 'ready' ? (
            <Text style={styles.progress}>
              {interpolate(t('ck_progress'), { checked: String(checkedCount), total: String(total) })}
            </Text>
          ) : null}
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {header}
      {notice ? (
        <View
          style={[
            styles.notice,
            notice.tone === 'ok' ? styles.noticeOk : styles.noticeWarn,
          ]}
          accessibilityLiveRegion="polite"
        >
          <Text style={[styles.noticeText, notice.tone === 'ok' ? styles.noticeTextOk : styles.noticeTextWarn]}>
            {t(notice.messageKey)}
          </Text>
        </View>
      ) : null}

      {status === 'loading' ? (
        <ScreenSkeleton />
      ) : status === 'error' ? (
        <ErrorRetry onRetry={load} />
      ) : attendees.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('ck_rosterEmptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('ck_rosterEmptyBody')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {attendees.map((a) => {
            const checked = !!a.checkedInAt;
            const pending = pendingId === a.bookingId;
            return (
              <View key={a.bookingId} style={styles.row}>
                {a.attendee.avatarUrl ? (
                  <Image source={{ uri: a.attendee.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{initial(a.attendee.displayName)}</Text>
                  </View>
                )}
                <Text style={styles.name} numberOfLines={1}>
                  {a.attendee.displayName ?? t('ck_guestFallback')}
                </Text>

                {checked ? (
                  <View style={styles.checkedPill}>
                    <Check size={14} color={tokens.color.forest} strokeWidth={2.4} />
                    <Text style={styles.checkedText}>{t('ck_checkedIn')}</Text>
                  </View>
                ) : pending ? (
                  <View style={styles.confirmRow}>
                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => setPendingId(null)}
                      accessibilityRole="button"
                      accessibilityLabel={t('ck_cancel')}
                    >
                      <Text style={styles.cancelText}>{t('ck_cancel')}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.confirmBtn}
                      onPress={() => void confirmCheckIn(a)}
                      accessibilityRole="button"
                      accessibilityLabel={t('ck_confirm')}
                    >
                      <Text style={styles.confirmText}>{t('ck_confirm')}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.checkInBtn}
                    onPress={() => setPendingId(a.bookingId)}
                    disabled={busyId === a.bookingId}
                    accessibilityRole="button"
                    accessibilityLabel={interpolate(t('ck_checkInName'), {
                      name: a.attendee.displayName ?? t('ck_guestFallback'),
                    })}
                  >
                    <Text style={styles.checkInText}>{t('ck_checkInAction')}</Text>
                  </Pressable>
                )}
              </View>
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
  title: { fontFamily: fonts.displaySemi, fontSize: 18, color: tokens.color.ink },
  progress: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: tokens.color.forest, marginTop: 1 }, // 9.44:1

  notice: { marginHorizontal: 16, marginBottom: 6, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  noticeOk: { backgroundColor: tokens.color.forestSoft },
  noticeWarn: { backgroundColor: tokens.color.bg2, borderWidth: 1, borderColor: tokens.color.border },
  noticeText: { fontFamily: fonts.bodySemi, fontSize: 13.5 },
  noticeTextOk: { color: tokens.color.forest }, // forest/forestSoft 8.53:1
  noticeTextWarn: { color: tokens.color.coralInk }, // coralInk/bg2 ~5.6:1

  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: tokens.color.forestSoft },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: fonts.displaySemi, fontSize: 16, color: tokens.color.forest },
  name: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: tokens.color.ink },

  checkedPill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  checkedText: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.forest }, // 9.44:1

  checkInBtn: {
    borderWidth: 1,
    borderColor: tokens.color.forest,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  checkInText: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.forest },

  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  cancelText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: tokens.color.text2 },
  confirmBtn: { backgroundColor: tokens.color.forest, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  confirmText: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.cream }, // cream/forest 10.44:1

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 8 },
  emptyTitle: { fontFamily: fonts.displaySemi, fontSize: 19, color: tokens.color.ink, textAlign: 'center' },
  emptyBody: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: tokens.color.text2, textAlign: 'center' },
});
