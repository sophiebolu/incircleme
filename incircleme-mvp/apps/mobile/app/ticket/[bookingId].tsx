import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar,
  CalendarHeart,
  CheckCircle2,
  ChevronRight,
  CircleX,
  Compass,
  CreditCard,
  Hourglass,
  MapPin,
  MessageCircle,
  Send,
  Users,
  Wallet,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import type { BookingListItem, EventDetail } from '@incircleme/types';
import { formatDate, formatDateTime, formatPrice, interpolate, t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { CancelSheet } from '../../components/CancelSheet';
import { ErrorRetry, NotFound, ScreenSkeleton } from '../../components/ScreenStates';
import { EventImageFallback } from '../../components/EventImageFallback';
import { BrandBar } from '../../components/BrandBar';
import { HostRow } from '../../components/HostRow';
import { useNavClearance } from '../../lib/useNavClearance';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';


// Display-only short id derived from the booking UUID (e.g. IM-3F9K2). The QR encodes
// the *full* booking id so a future check-in scanner has an unambiguous lookup key.
const shortTicketId = (bookingId: string): string =>
  'IM-' + bookingId.replace(/[^a-z0-9]/gi, '').slice(-5).toUpperCase();

function useTicker(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  return now;
}

const pad = (n: number) => String(n).padStart(2, '0');
const euros = (cents: number): string => {
  const v = cents / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

export default function TicketScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingListItem | null>(null);
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [holder, setHolder] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notFound' | 'error'>('loading');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [supportFallback, setSupportFallback] = useState(false); // mailto can't open → show address
  const navClearance = useNavClearance();
  const now = useTicker();

  const load = useCallback(() => {
    if (!bookingId) return;
    setStatus('loading');
    api
      .myBookings()
      .then((list) => {
        const b = list.find((x) => x.id === bookingId) ?? null;
        setBooking(b);
        setStatus(b ? 'ready' : 'notFound');
        if (b) api.getEvent(b.event.id).then(setDetail).catch(() => {});
      })
      .catch(() => setStatus('error'));
    api
      .me()
      .then((m) => setHolder(m.displayName ?? m.email ?? null))
      .catch(() => {});
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  // Wallet / Calendar / running-late have no backend yet → brief notice (NOT cancel).
  const comingSoon = () => {
    setNotice(t('prof_comingSoon'));
    setTimeout(() => setNotice(null), 1800);
  };

  // Shared chrome for the loading / error / not-found states (no blank shell).
  const chrome = (children: ReactNode) => (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <View style={styles.appbar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('onb_back')}
        >
          <Text style={styles.back}>←</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>{t('ticket_title')}</Text>
          <Text style={styles.sub}>{t('ticket_subtitle')}</Text>
        </View>
      </View>
      {children}
    </SafeAreaView>
  );

  if (status === 'loading') return chrome(<ScreenSkeleton />);
  if (status === 'error') return chrome(<ErrorRetry onRetry={load} />);
  if (status === 'notFound' || !booking) return chrome(<NotFound />);

  const ev = booking.event;
  const ticketId = shortTicketId(booking.id);
  const heroLine = `${formatDateTime(ev.startsAt, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })} · ${ev.neighbourhood ?? 'Barcelona'} · ${formatPrice(booking.amountCents, ev.currency)}`;
  const dateValue = `${formatDateTime(ev.startsAt, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })} – ${formatDateTime(ev.endsAt, { hour: '2-digit', minute: '2-digit' })}`;
  const issued = formatDate(booking.bookedAt, { day: 'numeric', month: 'short' });
  const barri = ev.neighbourhood ?? 'Barcelona';

  const ms = Math.max(0, new Date(ev.startsAt).getTime() - now);
  const countdown = `${pad(Math.floor(ms / 3_600_000))} : ${pad(
    Math.floor((ms % 3_600_000) / 60_000),
  )} : ${pad(Math.floor((ms % 60_000) / 1000))}`;

  // P0 fix — QR / countdown / live-cancel ONLY when confirmed AND upcoming.
  const isPast = now > new Date(ev.endsAt).getTime();
  const isHeld = booking.status === 'held';
  const isCancelled = booking.status === 'cancelled' || booking.status === 'refunded';
  const isActive = booking.status === 'confirmed' && !isPast;
  const isAttended = booking.status === 'confirmed' && isPast;
  // Host has scanned this confirmed ticket in (Slice 2a) — surfaced as a badge on the live ticket.
  const isCheckedIn = booking.status === 'confirmed' && !!booking.checkedInAt;
  // Post-commit refunds can be in-flight ('pending') or 'failed' — never render a bare
  // "Cancelled" that stays silent about money owed (promise-delivery).
  const cancelledLine =
    booking.refundStatus === 'full' && booking.refundCents > 0
      ? interpolate(t('tk_cancelledRefunded'), { amount: euros(booking.refundCents) })
      : booking.refundStatus === 'pending'
        ? t('tk_cancelledRefundPending')
        : booking.refundStatus === 'failed'
          ? t('tk_cancelledRefundFailed')
          : booking.creditIssuedCents > 0
            ? interpolate(t('tk_cancelledCredit'), { amount: euros(booking.creditIssuedCents) })
            : t('tk_cancelledNoRefund');

  const isRefundFailed = isCancelled && booking.refundStatus === 'failed';
  const SUPPORT_EMAIL = 'hola@incircleme.com';
  const onContactSupport = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Refund help — booking ${booking.id}`)}`;
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // fall through to the selectable-address fallback
    }
    setSupportFallback(true); // no mail client — reveal the address instead of no-opping
  };

  const openMaps = () => {
    void Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${barri}, Barcelona`)}`,
    );
  };
  const share = () => {
    void Share.share({ message: `${ev.title} · ${heroLine}` });
  };

  // Location sub-line: real address once unlocked (T-1), else the locale-aware
  // "address unlocks the day before" (reuses the §20 locked keys — not duplicated).
  const locationSub = detail
    ? detail.addressLocked
      ? `${t('addressUnlocksPrefix')}${t('addressUnlocksEm')}`
      : (detail.address ?? '')
    : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>{t('ticket_title')}</Text>
          <Text style={styles.sub}>{t('ticket_subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: navClearance }]}>
        {/* Hero — real photo, or a branded fallback (warm ground + monogram) when the event
            has none. On the fallback the title/meta flip to dark ink for AA. */}
        <View style={styles.hero}>
          {ev.photoUrls.length > 0 ? (
            <>
              <Image source={{ uri: ev.photoUrls[0] }} style={styles.heroImg} />
              <View style={styles.heroOverlay} />
            </>
          ) : (
            <EventImageFallback style={StyleSheet.absoluteFill} size={30} />
          )}
          {booking.status === 'confirmed' ? (
            <View style={[styles.heroBadge, ev.photoUrls.length === 0 && styles.heroChipOnLight]}>
              <CheckCircle2 size={12} color={tokens.color.forest} strokeWidth={2.4} />
              <Text style={styles.heroBadgeText}>{t('ticket_badgeConfirmed')}</Text>
            </View>
          ) : null}
          <Text style={[styles.heroIdChip, ev.photoUrls.length === 0 && styles.heroChipOnLight]}>
            {ticketId}
          </Text>
          <View style={styles.heroBody}>
            <Text
              style={[styles.heroTitle, ev.photoUrls.length === 0 && styles.heroTitleDark]}
              numberOfLines={2}
            >
              {ev.title}
            </Text>
            <Text
              style={[styles.heroMeta, ev.photoUrls.length === 0 && styles.heroMetaDark]}
              numberOfLines={1}
            >
              {heroLine}
            </Text>
          </View>
        </View>

        {/* Live entry (QR + countdown) ONLY when confirmed AND upcoming — the P0 fix. */}
        {isActive ? (
          <>
            <View style={styles.countdown}>
              <Text style={styles.cdL}>{t('ticket_startsIn')}</Text>
              <Text style={styles.cdN}>{countdown}</Text>
              <Text style={styles.cdS}>{t('ticket_remind')}</Text>
            </View>

            {/* QR card — coral corner brackets + holder line */}
            <View style={styles.qrCard}>
              <View style={[styles.corner, styles.cTL]} />
              <View style={[styles.corner, styles.cTR]} />
              <View style={[styles.corner, styles.cBL]} />
              <View style={[styles.corner, styles.cBR]} />
              {isCheckedIn ? (
                <View style={styles.checkedBadge} accessibilityLiveRegion="polite">
                  <CheckCircle2 size={16} color={tokens.color.forest} strokeWidth={2.4} />
                  <Text style={styles.checkedBadgeText}>{t('tk_checkedIn')}</Text>
                </View>
              ) : null}
              <Text style={styles.qrLbl}>{isCheckedIn ? t('tk_checkedInSub') : t('ticket_showAtDoor')}</Text>
              <View style={styles.qrBox} accessible accessibilityLabel={t('tk_qrLabel')}>
                <QRCode value={booking.id} size={148} color={tokens.color.ink} backgroundColor="#FFFFFF" />
              </View>
              <Text style={styles.holderNm}>
                {holder ?? '—'} · <Text style={styles.em}>{t('ticket_admitOne')}</Text>
              </Text>
              <Text style={styles.holderMeta}>
                {ticketId}  ·  {issued}
              </Text>
            </View>
          </>
        ) : (
          // No QR for held / cancelled / attended — a state banner instead.
          <View style={styles.stateBanner}>
            {isHeld ? (
              <Hourglass size={18} color={tokens.color.coralInk} strokeWidth={2} />
            ) : isCancelled ? (
              <CircleX size={18} color={tokens.color.coralInk} strokeWidth={2} />
            ) : (
              <CheckCircle2 size={18} color={tokens.color.forest} strokeWidth={2} />
            )}
            <Text style={styles.stateBannerText}>
              {isHeld ? t('tk_heldNoQr') : isCancelled ? cancelledLine : t('tk_attended')}
            </Text>
            {isAttended ? (
              <Pressable
                style={styles.reviewCta}
                onPress={() => router.push(`/review/${booking.id}`)}
                accessibilityRole="button"
              >
                <Text style={styles.reviewCtaText}>{t('tk_reviewCta')}</Text>
              </Pressable>
            ) : null}
            {isRefundFailed ? (
              supportFallback ? (
                <Text style={styles.supportFallback} selectable accessibilityRole="text">
                  {SUPPORT_EMAIL}
                </Text>
              ) : (
                <Pressable
                  style={styles.supportCta}
                  onPress={onContactSupport}
                  accessibilityRole="button"
                  accessibilityLabel={t('tk_contactSupport')}
                >
                  <Text style={styles.supportCtaText}>{t('tk_contactSupport')}</Text>
                </Pressable>
              )
            ) : null}
          </View>
        )}

        {/* The details */}
        <View style={styles.details}>
          <Text style={styles.detailsTitle}>{t('ticket_detailsTitle')}</Text>
          <DetailRow icon={<Calendar size={16} color={tokens.color.forest} strokeWidth={2} />}
            label={t('ticket_detailsDatetime')} value={dateValue} />
          <DetailRow icon={<MapPin size={16} color={tokens.color.forest} strokeWidth={2} />}
            label={t('ticket_detailsLocation')} value={barri} sub={locationSub} />
          <DetailRow icon={<Users size={16} color={tokens.color.forest} strokeWidth={2} />}
            label={t('ticket_detailsSmallGroup')} value={`${ev.seatsBooked} / ${ev.seatCount}`} />
          <DetailRow icon={<CreditCard size={16} color={tokens.color.forest} strokeWidth={2} />}
            label={t('ticket_detailsPaid')} value={formatPrice(booking.amountCents, ev.currency)} />
        </View>

        {/* Host strip → the host's PUBLIC profile (never the self-Passport) */}
        {detail?.host ? (
          <HostRow host={detail.host} onPress={() => router.push(`/u/${detail.host.id}`)} />
        ) : null}

        {/* Circle deeplink */}
        {booking.circleId ? (
          <Pressable
            style={styles.circleCard}
            onPress={() => router.push(`/circle/${booking.circleId}`)}
            accessibilityRole="button"
          >
            <View style={styles.circleIc}>
              <MessageCircle size={18} color={tokens.color.forest} strokeWidth={2} />
            </View>
            <View style={styles.circleBody}>
              <Text style={styles.circleTitle}>{t('ticket_circleActive')}</Text>
              {booking.circleMemberCount != null ? (
                <Text style={styles.circleSub}>· {booking.circleMemberCount}</Text>
              ) : null}
            </View>
            <ChevronRight size={18} color={tokens.color.gray} strokeWidth={2} />
          </Pressable>
        ) : null}

        {/* Util line — icon-only (labels not in the §26 table; flagged for sign-off) */}
        <View style={styles.utilLine}>
          <Pressable style={styles.util} onPress={comingSoon} accessibilityLabel="Wallet">
            <Wallet size={18} color={tokens.color.text2} strokeWidth={2} />
          </Pressable>
          <View style={styles.utilSep} />
          <Pressable style={styles.util} onPress={share} accessibilityLabel="Share">
            <Send size={18} color={tokens.color.text2} strokeWidth={2} />
          </Pressable>
          <View style={styles.utilSep} />
          <Pressable style={styles.util} onPress={comingSoon} accessibilityLabel="Calendar">
            <CalendarHeart size={18} color={tokens.color.text2} strokeWidth={2} />
          </Pressable>
          <View style={styles.utilSep} />
          <Pressable style={styles.util} onPress={openMaps} accessibilityLabel={t('ev_openInMaps')}>
            <Compass size={18} color={tokens.color.text2} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Live actions (running-late + cancel) ONLY when confirmed + upcoming. */}
        {isActive ? (
          <>
            <View style={styles.liveEyebrow}>
              <View style={styles.liveLine} />
            </View>
            <Pressable style={styles.liveRow} onPress={comingSoon} accessibilityRole="button">
              <View style={styles.liveIc}>
                <Hourglass size={16} color={tokens.color.coralInk} strokeWidth={2} />
              </View>
              <Text style={styles.liveTitle}>{t('ticket_late')}</Text>
              <ChevronRight size={16} color={tokens.color.gray} strokeWidth={2} />
            </Pressable>
            <Pressable
              style={styles.liveRow}
              onPress={() => setSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('ticket_cancelCta')}
            >
              <View style={styles.liveIc}>
                <CircleX size={16} color={tokens.color.coralInk} strokeWidth={2} />
              </View>
              <View style={styles.liveBody}>
                <Text style={styles.liveTitle}>{t('ticket_cancelCta')}</Text>
                <Text style={styles.liveSub}>{t('ticket_cancelSub')}</Text>
              </View>
              <ChevronRight size={16} color={tokens.color.gray} strokeWidth={2} />
            </Pressable>
          </>
        ) : null}

        {/* Footer flourish */}
        <Text style={styles.footer}>{t('ticket_footer')}</Text>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </ScrollView>

      <CancelSheet
        bookingId={booking.id}
        amountCents={booking.amountCents}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCancelled={load}
      />
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={styles.dRow}>
      <View style={styles.dIc}>{icon}</View>
      <View style={styles.dBody}>
        <Text style={styles.dLabel}>{label}</Text>
        <Text style={styles.dValue}>{value}</Text>
        {sub ? <Text style={styles.dSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 6 },
  back: { fontSize: 22, color: tokens.color.ink },
  title: { fontFamily: fonts.displaySemi, fontSize: 18, color: tokens.color.ink },
  sub: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2 },
  content: { padding: 16, gap: 12 },

  // Non-active state banner (held / cancelled / attended) — forest, AA on forestSoft.
  stateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: tokens.color.forestSoft,
    borderRadius: 14,
    padding: 16,
  },
  stateBannerText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.forest },
  reviewCta: {
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  reviewCtaText: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.cream },
  // Failed-refund contact-support button — filled coralInk (warning system); cream text on
  // coralInk = 4.73:1 (AA). Full-width below the banner text (wraps in the flex row).
  supportCta: {
    backgroundColor: tokens.color.coralInk,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  supportCtaText: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.cream },
  // Fallback when no mail client: selectable address. forest on forestSoft banner = 8.53:1 (AA).
  supportFallback: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.forest },

  // Hero
  hero: { height: 168, borderRadius: 16, overflow: 'hidden', backgroundColor: tokens.color.forest },
  heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(38,40,35,0.34)' },
  heroBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.color.cream,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  heroBadgeText: { fontFamily: fonts.bodyHeavy, fontSize: 9.5, letterSpacing: 0.4, color: tokens.color.forest },
  heroIdChip: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 0.6,
    color: tokens.color.ink,
    backgroundColor: tokens.color.cream,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  heroBody: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  heroTitle: { fontFamily: fonts.display, fontSize: 22, color: tokens.color.cream, lineHeight: 25 },
  heroMeta: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.cream, marginTop: 3, opacity: 0.95 },
  // No-photo branded fallback: dark text for AA on the warm forestSoft ground.
  heroTitleDark: { color: tokens.color.ink },
  heroMetaDark: { color: tokens.color.forest, opacity: 1 },
  heroChipOnLight: { borderWidth: 1, borderColor: tokens.color.border },

  // Countdown
  countdown: { alignItems: 'center', gap: 2 },
  cdL: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 0.4, color: tokens.color.text2 },
  cdN: { fontFamily: fonts.displaySemi, fontSize: 26, color: tokens.color.forest, letterSpacing: 1 },
  cdS: { fontFamily: fonts.body, fontSize: 11, color: tokens.color.text2 },

  // QR card
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
  },
  corner: { position: 'absolute', width: 18, height: 18, borderColor: tokens.color.coral },
  cTL: { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2 },
  cTR: { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2 },
  cBL: { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2 },
  cBR: { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2 },
  qrLbl: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: tokens.color.text2 },
  qrBox: { padding: 8, backgroundColor: '#FFFFFF' },
  // "✓ Checked in" — forest on forestSoft (8.53:1), never gold. S8: no goldGlow for a neutral/ok state.
  checkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: tokens.color.forestSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  checkedBadgeText: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.forest },
  holderNm: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: tokens.color.ink, marginTop: 2 },
  em: { fontFamily: fonts.displayItalic, color: tokens.color.coralInk },
  holderMeta: { fontFamily: fonts.body, fontSize: 11, color: tokens.color.text2, letterSpacing: 0.3 },

  // Details
  details: {
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  detailsTitle: { fontFamily: fonts.displaySemi, fontSize: 15, color: tokens.color.ink },
  dRow: { flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  dIc: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: tokens.color.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dBody: { flex: 1, gap: 1 },
  dLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 0.3, color: tokens.color.text2 },
  dValue: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: tokens.color.ink },
  dSub: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2, marginTop: 1 },

  // Circle deeplink
  circleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.color.forestSoft,
    borderRadius: 14,
    padding: 12,
  },
  circleIc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.color.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBody: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  circleTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.forest },
  circleSub: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: tokens.color.text2 },

  // Util line
  utilLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  util: { paddingHorizontal: 16, paddingVertical: 6 },
  utilSep: { width: 1, height: 16, backgroundColor: tokens.color.border },

  // If something changes
  liveEyebrow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  liveLine: { flex: 1, height: 1, backgroundColor: tokens.color.border },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  liveIc: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: 'rgba(166,86,58,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBody: { flex: 1, gap: 1 },
  liveTitle: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13.5, color: tokens.color.ink },
  liveSub: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2 },

  footer: {
    fontFamily: fonts.displayItalic,
    fontSize: 13,
    color: tokens.color.coralInk,
    textAlign: 'center',
    paddingTop: 8,
  },
  notice: {
    alignSelf: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: tokens.color.ink,
    backgroundColor: tokens.color.goldGlow,
    borderColor: tokens.color.goldBorder,
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
});
