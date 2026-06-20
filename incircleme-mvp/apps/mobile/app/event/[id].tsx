import { useEffect, useState, type ReactNode } from 'react';
import { Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ExternalLink,
  Lock,
  MapPin,
  RotateCcw,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react-native';
import type { EventDetail } from '@incircleme/types';
import { formatDateTime, formatPrice, interpolate, t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { HostRow } from '../../components/HostRow';
import { BrandBar } from '../../components/BrandBar';
import { useNavClearance } from '../../lib/useNavClearance';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200';
const MAX_PROOF_AVATARS = 6;

export default function Event() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const navClearance = useNavClearance();

  useEffect(() => {
    if (id) api.getEvent(id).then(setEvent).catch(() => setEvent(null));
  }, [id]);

  if (!event) {
    // TODO(deferred, needs copy verdict): explicit not-found / loading empty state.
    return <SafeAreaView style={styles.safe} />;
  }

  const when = formatDateTime(event.startsAt, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const price = event.priceCents === 0 ? '—' : formatPrice(event.priceCents, event.currency);
  const barri = event.neighbourhood ?? 'Barcelona';

  // About-eyebrow: italic last word (§13b), e.g. "About this room".
  const eyebrowWords = t('ev_aboutEyebrow').split(' ');
  const eyebrowLast = eyebrowWords.length > 1 ? eyebrowWords.pop()! : null;
  const hostFirstName = (event.host.displayName ?? '').split(' ')[0] ?? '';

  const proofAvatars = Math.min(MAX_PROOF_AVATARS, event.seatsBooked);
  const proofMore = event.seatsBooked - proofAvatars;

  const openMaps = () => {
    const q = encodeURIComponent(`${barri}, Barcelona`);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };
  const goTogether = () => {
    void Share.share({ message: `${event.title} · ${when} · ${barri}` });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: navClearance }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Image source={{ uri: event.photoUrls[0] ?? FALLBACK_PHOTO }} style={styles.hero} />
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.meta}>
          {barri} · {price}
        </Text>

        {/* Host trust row — taps to the host's public profile */}
        <View style={styles.section}>
          <HostRow host={event.host} onPress={() => router.push(`/u/${event.host.id}`)} />
        </View>

        {/* "Already coming" — count + decorative (anonymous) avatars + privacy note */}
        <View style={styles.proof}>
          <View style={styles.proofHead}>
            <Text style={styles.eyebrow}>{t('ev_alreadyComing').toUpperCase()}</Text>
            <Text style={styles.proofCount}>
              {interpolate(t('ev_spotsFilled'), {
                filled: String(event.seatsBooked),
                total: String(event.seatCount),
              })}
            </Text>
          </View>
          {proofAvatars > 0 ? (
            <View style={styles.proofRow}>
              <View style={styles.proofAvs}>
                {Array.from({ length: proofAvatars }).map((_, i) => (
                  <View key={i} style={[styles.proofAv, { marginLeft: i === 0 ? 0 : -10 }]} />
                ))}
              </View>
              {proofMore > 0 ? (
                <Text style={styles.proofMore}>
                  {interpolate(t('ev_moreCount'), { n: String(proofMore) })}
                </Text>
              ) : null}
            </View>
          ) : null}
          <Text style={styles.proofNote}>{t('ev_circleAfterBooking')}</Text>
        </View>

        {/* About this room — editorial eyebrow + body + host signature */}
        {event.description ? (
          <View style={styles.story}>
            <Text style={styles.storyEyebrow}>
              {eyebrowWords.join(' ')}
              {eyebrowLast ? ' ' : ''}
              {eyebrowLast ? <Text style={styles.storyEyebrowEm}>{eyebrowLast}</Text> : null}
            </Text>
            <Text style={styles.storyBody}>{event.description}</Text>
            {hostFirstName ? <Text style={styles.storySig}>— {hostFirstName}</Text> : null}
          </View>
        ) : null}

        {/* When + refund policy */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('ev_when')}</Text>
          <Text style={styles.cardValue}>
            {when}
            {event.durationMinutes ? ` · ${event.durationMinutes} min` : ''}
          </Text>
          <Text style={styles.cardSub}>{t('ev_refundPolicy')}</Text>
        </View>

        {/* Where + decorative mini-map (approx area; exact address stays locked till T-1) */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('ev_where')}</Text>
          <Text style={styles.cardValue}>{barri}</Text>
          <Pressable style={styles.miniMap} onPress={openMaps} accessibilityRole="button">
            <View style={[styles.road, { top: '32%' }]} />
            <View style={[styles.road, { top: '66%' }]} />
            <View style={styles.roadV} />
            <View style={styles.pin}>
              <MapPin size={16} color={tokens.color.cream} strokeWidth={2.4} />
            </View>
            <View style={styles.mapHint}>
              <ExternalLink size={11} color={tokens.color.coralInk} strokeWidth={2} />
              <Text style={styles.mapHintText}>{t('ev_openInMaps')}</Text>
            </View>
          </Pressable>
          <Text style={styles.cardSub}>
            {event.addressLocked
              ? `${t('addressUnlocksPrefix')}${t('addressUnlocksEm')}.`
              : event.address}
          </Text>
        </View>

        {/* Why book through us — trust grid */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('ev_whyBook')}</Text>
          <View style={styles.trustGrid}>
            <TrustItem icon={<ShieldCheck size={17} color={tokens.color.forest} strokeWidth={2} />} title={t('ev_trustInsuredT')} sub={t('ev_trustInsuredS')} />
            <TrustItem icon={<RotateCcw size={17} color={tokens.color.forest} strokeWidth={2} />} title={t('ev_trustRefundT')} sub={t('ev_trustRefundS')} />
            <TrustItem icon={<Lock size={17} color={tokens.color.forest} strokeWidth={2} />} title={t('ev_trustPayT')} sub={t('ev_trustPayS')} />
            <TrustItem icon={<Users size={17} color={tokens.color.forest} strokeWidth={2} />} title={t('ev_trustCircleT')} sub={t('ev_trustCircleS')} />
          </View>
        </View>

        {/* Seats (+ creator-optional seat hold) */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('ev_seats')}</Text>
          <View style={styles.seatRow}>
            <View style={styles.seatLeft}>
              <View style={styles.seatTitleRow}>
                <Text style={styles.cardValue}>{t('ev_generalAdmission')}</Text>
                {event.depositRequired ? (
                  <View style={styles.holdChip}>
                    <Shield size={11} color={tokens.color.goldDeep} strokeWidth={2} />
                    <Text style={styles.holdChipText}>
                      {interpolate(t('ev_seatHoldChip'), {
                        amount: formatPrice(event.depositAmountCents, event.currency),
                      })}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.cardSub}>{price}</Text>
            </View>
            <View style={event.roomFull ? styles.seatBadgeFull : styles.seatBadge}>
              <Text style={event.roomFull ? styles.seatBadgeFullText : styles.seatBadgeText}>
                {event.roomFull
                  ? t('roomFull')
                  : `${event.seatsLeft} ${t('seatsLeft').toLowerCase()}`}
              </Text>
            </View>
          </View>
          {event.depositRequired ? (
            <Text style={styles.holdExplain}>{t('ev_seatHoldExplain')}</Text>
          ) : null}
        </View>

        {/* Primary CTA */}
        {event.roomFull ? (
          <View style={[styles.cta, styles.ctaFull]}>
            <Text style={styles.ctaFullText}>{t('roomFull')}</Text>
          </View>
        ) : (
          <Pressable style={styles.cta} onPress={() => router.push(`/book/${event.id}`)}>
            <Text style={styles.ctaText}>{t('bookThisRoom')}</Text>
          </Pressable>
        )}

        {/* Go together (share) */}
        <Pressable style={styles.ghost} onPress={goTogether}>
          <UserPlus size={16} color={tokens.color.ink} strokeWidth={2} />
          <Text style={styles.ghostText}>{t('ev_goTogether')}</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

function TrustItem({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <View style={styles.trustItem}>
      <View style={styles.trustIc}>{icon}</View>
      <View style={styles.trustTx}>
        <Text style={styles.trustTitle}>{title}</Text>
        <Text style={styles.trustSub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  content: { padding: 16, paddingBottom: 40 },
  back: { fontSize: 22, color: tokens.color.ink, marginBottom: 8 },
  hero: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16, backgroundColor: tokens.color.border },
  title: { fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.4, color: tokens.color.ink, marginTop: 14 },
  meta: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.text2, marginTop: 4 },
  section: { marginTop: 16 },

  eyebrow: { fontFamily: fonts.bodyHeavy, fontSize: 10, letterSpacing: 1, color: tokens.color.coralInk },

  // Social proof
  proof: {
    marginTop: 16,
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  proofHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proofCount: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: tokens.color.ink },
  proofRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  proofAvs: { flexDirection: 'row' },
  proofAv: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: tokens.color.forestSoft,
    borderColor: tokens.color.bg2,
    borderWidth: 1.5,
  },
  proofMore: { fontFamily: fonts.bodyMedium, fontSize: 12, color: tokens.color.text2 },
  proofNote: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: tokens.color.text2 },

  // About story
  story: { marginTop: 18 },
  storyEyebrow: { fontFamily: fonts.bodyHeavy, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: tokens.color.coralInk },
  storyEyebrowEm: { fontStyle: 'italic' },
  storyBody: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: tokens.color.ink, marginTop: 8 },
  storySig: { fontFamily: fonts.displayItalic, fontSize: 14, color: tokens.color.text2, marginTop: 8 },

  // Cards
  card: {
    marginTop: 14,
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  cardLabel: { fontFamily: fonts.bodyHeavy, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: tokens.color.coralInk, marginBottom: 6 },
  cardValue: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: tokens.color.ink },
  cardSub: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2, marginTop: 2 },

  // Mini-map
  miniMap: {
    height: 96,
    borderRadius: 12,
    backgroundColor: tokens.color.forestSoft,
    marginTop: 10,
    overflow: 'hidden',
  },
  road: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: tokens.color.bg2 },
  roadV: { position: 'absolute', top: 0, bottom: 0, left: '46%', width: 3, backgroundColor: tokens.color.bg2 },
  pin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -13,
    marginTop: -13,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: tokens.color.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapHint: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.color.bg2,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mapHintText: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: tokens.color.coralInk },

  // Trust grid
  trustGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 2 },
  trustItem: { flexDirection: 'row', gap: 8, width: '46%', alignItems: 'flex-start' },
  trustIc: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: tokens.color.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTx: { flex: 1 },
  trustTitle: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: tokens.color.ink },
  trustSub: { fontFamily: fonts.body, fontSize: 10.5, lineHeight: 14, color: tokens.color.text2 },

  // Seats
  seatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seatLeft: { flex: 1, gap: 2 },
  seatTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  holdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.color.goldGlow,
    borderColor: tokens.color.goldBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  holdChipText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: tokens.color.goldDeep },
  holdExplain: { fontFamily: fonts.body, fontSize: 11, color: tokens.color.text2, marginTop: 8 },
  seatBadge: {
    backgroundColor: tokens.color.coralSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  seatBadgeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: tokens.color.coralInk },
  seatBadgeFull: { backgroundColor: tokens.color.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  seatBadgeFullText: { fontFamily: fonts.bodySemi, fontSize: 11, color: tokens.color.text2 },

  // CTA
  cta: { backgroundColor: tokens.color.forest, borderRadius: 999, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.cream },
  ctaFull: { backgroundColor: tokens.color.border },
  ctaFullText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.gray },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    marginTop: 8,
  },
  ghostText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: tokens.color.ink },

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
    marginTop: 12,
  },
});
