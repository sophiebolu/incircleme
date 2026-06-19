import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, ChevronRight, Heart, Send, ShieldCheck, Star } from 'lucide-react-native';
import type { BookingListItem, EventDetail, EventListItem } from '@incircleme/types';
import { formatDateTime, interpolate, t, type StringKey } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { BrandBar } from '../../components/BrandBar';
import { HostRow } from '../../components/HostRow';
import { EventCard } from '../../components/EventCard';
import { useNavClearance } from '../../lib/useNavClearance';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=720';

// Mirrors @incircleme/config REVIEWS.vibeTags (order = display order). Config is the
// source of truth; the service validates against it. Labels are localised here.
const VIBES: { key: string; label: StringKey }[] = [
  { key: 'warm_welcome', label: 'vibe_warmWelcome' },
  { key: 'well_organised', label: 'vibe_wellOrganised' },
  { key: 'small_group', label: 'vibe_smallGroup' },
  { key: 'beautiful_space', label: 'vibe_beautifulSpace' },
  { key: 'easy_to_meet', label: 'vibe_easyToMeet' },
  { key: 'felt_included', label: 'vibe_feltIncluded' },
];

type Step = 'prompt' | 'rate' | 'thanks';

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingListItem | null>(null);
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [similar, setSimilar] = useState<EventListItem[]>([]);
  const [step, setStep] = useState<Step>('prompt');
  const [rating, setRating] = useState(0);
  const [wouldGoAgain, setWouldGoAgain] = useState<boolean | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(false); // off by default (host-only)
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const navClearance = useNavClearance();

  useEffect(() => {
    if (!bookingId) return;
    void (async () => {
      try {
        const list = await api.myBookings();
        const b = list.find((x) => x.id === bookingId) ?? null;
        setBooking(b);
        if (b) api.getEvent(b.event.id).then(setDetail).catch(() => {});
      } catch {
        setBooking(null);
      }
      api.listEvents().then((r) => setSimilar(r.slice(0, 3))).catch(() => {});
    })();
  }, [bookingId]);

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandBar />
      </SafeAreaView>
    );
  }

  const ev = booking.event;
  const hostName = (detail?.host?.displayName ?? '—').split(' ')[0]!;
  const when = formatDateTime(ev.startsAt, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const photo = ev.photoUrls[0] ?? FALLBACK_PHOTO;

  const toggleTag = (key: string) =>
    setTags((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const submit = async () => {
    if (rating < 1 || sending) return;
    setSending(true);
    setError(false);
    try {
      await api.createReview({
        bookingId: booking.id,
        rating,
        wouldGoAgain: wouldGoAgain ?? undefined,
        vibeTags: tags,
        comment: comment.trim() || undefined,
        isPublic,
      });
      setStep('thanks');
    } catch {
      // Promise-Delivery: a failed send must say so, visibly.
      setError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <View style={styles.appbar}>
        <Pressable
          onPress={() => (step === 'rate' ? setStep('prompt') : router.back())}
          hitSlop={10}
        >
          <Text style={styles.back}>←</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>
            {step === 'rate' ? t('rev_rateTitle') : t('rev_promptTitle')}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {step === 'rate' ? `${ev.title} · ${hostName}` : t('rev_promptSub')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: navClearance }]}>
        {step === 'prompt' ? (
          <>
            <View style={styles.hero}>
              <Image source={{ uri: photo }} style={styles.heroImg} />
              <View style={styles.heroOverlay} />
              <View style={styles.heroBody}>
                <Text style={styles.heroEyebrow}>{t('rev_memoryFrom').toUpperCase()}</Text>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {ev.title}
                </Text>
                <Text style={styles.heroMeta}>
                  {when} · {ev.neighbourhood ?? 'Barcelona'}
                </Text>
              </View>
            </View>
            {detail?.host ? (
              <HostRow host={detail.host} onPress={() => router.push(`/u/${detail!.host!.id}`)} />
            ) : null}
            <Text style={styles.inviteQ}>{interpolate(t('rev_inviteQ'), { event: ev.title })}</Text>
            <Text style={styles.inviteSub}>
              {interpolate(t('rev_inviteSub'), { host: hostName })}
            </Text>
            <Pressable style={styles.cta} onPress={() => setStep('rate')}>
              <Text style={styles.ctaText}>{t('rev_promptTitle')}</Text>
              <ArrowRight size={16} color={tokens.color.cream} strokeWidth={2.2} />
            </Pressable>
            <Pressable style={styles.ghost} onPress={() => router.back()}>
              <Text style={styles.ghostText}>{t('rev_maybeLater')}</Text>
            </Pressable>
            <Text style={styles.tinyNote}>{t('rev_noReminders')}</Text>
          </>
        ) : null}

        {step === 'rate' ? (
          <>
            <Text style={styles.rateQ}>{t('rev_overallQ')}</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
                  <Star
                    size={34}
                    color={n <= rating ? tokens.color.gold : tokens.color.border}
                    fill={n <= rating ? tokens.color.gold : 'none'}
                    strokeWidth={1.6}
                  />
                </Pressable>
              ))}
            </View>
            <Text style={styles.starCaption}>{rating > 0 ? `${rating} / 5` : t('rev_tapStar')}</Text>

            {/* Explicit would-go-again — the product signal (not derived from stars) */}
            <Text style={styles.rateQ}>{t('rev_wouldGoAgain')}</Text>
            <View style={styles.yesNo}>
              <Pressable
                style={[styles.ynPill, wouldGoAgain === true && styles.ynPillOn]}
                onPress={() => setWouldGoAgain((v) => (v === true ? null : true))}
              >
                <Text style={[styles.ynText, wouldGoAgain === true && styles.ynTextOn]}>
                  {t('rev_yes')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.ynPill, wouldGoAgain === false && styles.ynPillOn]}
                onPress={() => setWouldGoAgain((v) => (v === false ? null : false))}
              >
                <Text style={[styles.ynText, wouldGoAgain === false && styles.ynTextOn]}>
                  {t('rev_no')}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.rateQ}>
              {t('rev_stoodOutQ')} <Text style={styles.optional}>({t('rev_optional')})</Text>
            </Text>
            <View style={styles.chips}>
              {VIBES.map((v) => (
                <Pressable
                  key={v.key}
                  style={[styles.chip, tags.includes(v.key) && styles.chipOn]}
                  onPress={() => toggleTag(v.key)}
                >
                  <Text style={[styles.chipText, tags.includes(v.key) && styles.chipTextOn]}>
                    {t(v.label)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.rateQ}>
              {interpolate(t('rev_hearQ'), { host: hostName })}{' '}
              <Text style={styles.optional}>({t('rev_optional')})</Text>
            </Text>
            <TextInput
              style={styles.comment}
              placeholder={t('rev_commentPlaceholder')}
              placeholderTextColor={tokens.color.gray}
              value={comment}
              onChangeText={setComment}
              multiline
            />

            <View style={styles.toggleRow}>
              <View style={styles.toggleBody}>
                <Text style={styles.toggleTitle}>{t('rev_sharePublic')}</Text>
                <Text style={styles.toggleSub}>{t('rev_sharePublicSub')}</Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ true: tokens.color.forest, false: tokens.color.border }}
                thumbColor={tokens.color.cream}
              />
            </View>

            {error ? <Text style={styles.error}>{t('verifyFailed')}</Text> : null}
            <Pressable
              style={[styles.cta, (rating < 1 || sending) && styles.ctaDisabled]}
              onPress={submit}
              disabled={rating < 1 || sending}
            >
              <Text style={styles.ctaText}>{interpolate(t('rev_send'), { host: hostName })}</Text>
              <Send size={15} color={tokens.color.cream} strokeWidth={2.2} />
            </Pressable>
          </>
        ) : null}

        {step === 'thanks' ? (
          <>
            <View style={styles.tyHero}>
              <View style={styles.tyIc}>
                <Heart size={22} color={tokens.color.coralInk} strokeWidth={2} />
              </View>
              <Text style={styles.tyTitle}>{interpolate(t('rev_thanksTitle'), { host: hostName })}</Text>
              <Text style={styles.tySub}>{t('rev_thanksSub')}</Text>
            </View>

            <Pressable style={styles.nudge} onPress={() => router.push('/passport')}>
              <View style={styles.nudgeIc}>
                <ShieldCheck size={18} color={tokens.color.forest} strokeWidth={2} />
              </View>
              <View style={styles.nudgeBody}>
                <Text style={styles.nudgeTitle}>{t('rev_passportNudge')}</Text>
                <Text style={styles.nudgeSub}>{t('rev_passportNudgeSub')}</Text>
              </View>
              <ChevronRight size={18} color={tokens.color.gray} strokeWidth={2} />
            </Pressable>

            {similar.length > 0 ? (
              <View style={styles.similar}>
                <Text style={styles.similarTitle}>{t('rev_similar')}</Text>
                {similar.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </View>
            ) : null}

            <Pressable style={styles.cta} onPress={() => router.replace('/')}>
              <Text style={styles.ctaText}>{t('rev_keepExploring')}</Text>
            </Pressable>
            <Pressable style={styles.ghost} onPress={() => router.replace('/bookings')}>
              <Text style={styles.ghostText}>{t('rev_backToBookings')}</Text>
            </Pressable>
            {!isPublic ? (
              <Text style={styles.tinyNote}>{interpolate(t('rev_privateNote'), { host: hostName })}</Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 6 },
  back: { fontSize: 22, color: tokens.color.ink },
  title: { fontFamily: fonts.displaySemi, fontSize: 18, color: tokens.color.ink },
  sub: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2 },
  content: { padding: 16, gap: 12 },

  hero: { height: 150, borderRadius: 16, overflow: 'hidden', backgroundColor: tokens.color.forest },
  heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(38,40,35,0.34)' },
  heroBody: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  heroEyebrow: { fontFamily: fonts.bodyHeavy, fontSize: 9.5, letterSpacing: 1.1, color: tokens.color.coralSoft },
  heroTitle: { fontFamily: fonts.display, fontSize: 22, color: tokens.color.cream, marginTop: 2 },
  heroMeta: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.cream, marginTop: 2, opacity: 0.95 },

  inviteQ: { fontFamily: fonts.display, fontSize: 20, color: tokens.color.ink, marginTop: 4 },
  inviteSub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: tokens.color.text2 },

  rateQ: { fontFamily: fonts.displaySemi, fontSize: 15, color: tokens.color.ink, marginTop: 6 },
  optional: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 4 },
  starCaption: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: tokens.color.text2, textAlign: 'center' },
  yesNo: { flexDirection: 'row', gap: 8 },
  ynPill: {
    flex: 1,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ynPillOn: { backgroundColor: tokens.color.forest, borderColor: tokens.color.forest },
  ynText: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.text2 },
  ynTextOn: { color: tokens.color.cream },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipOn: { backgroundColor: tokens.color.forest, borderColor: tokens.color.forest },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: tokens.color.text2 },
  chipTextOn: { color: tokens.color.cream },
  comment: {
    minHeight: 76,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: tokens.color.ink,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  toggleBody: { flex: 1, gap: 2 },
  toggleTitle: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.ink },
  toggleSub: { fontFamily: fonts.body, fontSize: 11, color: tokens.color.text2, lineHeight: 15 },

  cta: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingVertical: 13,
    marginTop: 6,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.cream },
  ghost: {
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: tokens.color.ink },
  tinyNote: { fontFamily: fonts.body, fontSize: 11, color: tokens.color.text2, textAlign: 'center', lineHeight: 16, marginTop: 4 },
  error: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: tokens.color.coralInk,
    backgroundColor: 'rgba(166,86,58,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  // Thanks
  tyHero: { alignItems: 'center', gap: 8, paddingTop: 8 },
  tyIc: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(166,86,58,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tyTitle: { fontFamily: fonts.display, fontSize: 22, color: tokens.color.ink, textAlign: 'center' },
  tySub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: tokens.color.text2, textAlign: 'center' },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.color.forestSoft,
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
  },
  nudgeIc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.color.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeBody: { flex: 1, gap: 1 },
  nudgeTitle: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: tokens.color.forest },
  nudgeSub: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2 },
  similar: { gap: 10, marginTop: 6 },
  similarTitle: { fontFamily: fonts.displaySemi, fontSize: 15, color: tokens.color.ink },
});
