import { useEffect, useState, type ReactNode } from 'react';
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
import { formatDate, formatDateTime, formatPrice, t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { BrandBar } from '../../components/BrandBar';
import { HostRow } from '../../components/HostRow';
import { useNavClearance } from '../../lib/useNavClearance';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=720';

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

export default function TicketScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingListItem | null>(null);
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [holder, setHolder] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const navClearance = useNavClearance();
  const now = useTicker();

  useEffect(() => {
    if (!bookingId) return;
    void (async () => {
      try {
        const list = await api.myBookings();
        const b = list.find((x) => x.id === bookingId) ?? null;
        setBooking(b);
        if (b) api.getEvent(b.event.id).then(setDetail).catch(() => {});
        api
          .me()
          .then((m) => setHolder(m.displayName ?? m.email ?? null))
          .catch(() => {});
      } catch {
        setBooking(null);
      }
    })();
  }, [bookingId]);

  // Live actions (running-late) + Wallet/Calendar have no backend yet → brief notice.
  const comingSoon = () => {
    setNotice(t('prof_comingSoon'));
    setTimeout(() => setNotice(null), 1800);
  };

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandBar />
      </SafeAreaView>
    );
  }

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
        {/* Hero — photo + Confirmed badge + booking-id chip + Fraunces title */}
        <View style={styles.hero}>
          <Image source={{ uri: ev.photoUrls[0] ?? FALLBACK_PHOTO }} style={styles.heroImg} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBadge}>
            <CheckCircle2 size={12} color={tokens.color.forest} strokeWidth={2.4} />
            <Text style={styles.heroBadgeText}>{t('ticket_badgeConfirmed')}</Text>
          </View>
          <Text style={styles.heroIdChip}>{ticketId}</Text>
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {ev.title}
            </Text>
            <Text style={styles.heroMeta} numberOfLines={1}>
              {heroLine}
            </Text>
          </View>
        </View>

        {/* Countdown */}
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
          <Text style={styles.qrLbl}>{t('ticket_showAtDoor')}</Text>
          <View style={styles.qrBox}>
            <QRCode value={booking.id} size={148} color={tokens.color.ink} backgroundColor="#FFFFFF" />
          </View>
          <Text style={styles.holderNm}>
            {holder ?? '—'} · <Text style={styles.em}>{t('ticket_admitOne')}</Text>
          </Text>
          <Text style={styles.holderMeta}>
            {ticketId}  ·  {issued}
          </Text>
        </View>

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

        {/* Host strip → Reputation Passport (reuses HostRow + its locked copy) */}
        {detail?.host ? (
          <HostRow host={detail.host} onPress={() => router.push('/passport')} />
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

        {/* If something changes */}
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
        <Pressable style={styles.liveRow} onPress={comingSoon} accessibilityRole="button">
          <View style={styles.liveIc}>
            <CircleX size={16} color={tokens.color.coralInk} strokeWidth={2} />
          </View>
          <View style={styles.liveBody}>
            <Text style={styles.liveTitle}>{t('ticket_cancelCta')}</Text>
            <Text style={styles.liveSub}>{t('ticket_cancelSub')}</Text>
          </View>
          <ChevronRight size={16} color={tokens.color.gray} strokeWidth={2} />
        </Pressable>

        {/* Footer flourish */}
        <Text style={styles.footer}>{t('ticket_footer')}</Text>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </ScrollView>
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
