import { useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, MessageCircle, Star } from 'lucide-react-native';
import type { Capsule, ReviewAggregate } from '@incircleme/types';
import {
  t,
  interpolate,
  formatDate,
  formatTime,
  getActiveLocale,
  type Locale,
} from '@incircleme/i18n';
import { api } from '../../lib/api';
import { savePhotoToDevice } from '../../lib/savePhoto';
import { BrandBar } from '../../components/BrandBar';
import { useNavClearance } from '../../lib/useNavClearance';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const abs = (url: string) => (url.startsWith('http') ? url : `${API_BASE}${url}`);

export default function CapsuleScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const router = useRouter();
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewAggregate | null>(null);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const navClearance = useNavClearance();

  // Full-gallery screen is deferred — surface a brief "coming soon".
  const comingSoon = () => {
    setNotice(t('prof_comingSoon'));
    setTimeout(() => setNotice(null), 1800);
  };

  const PHOTO_PREVIEW = 7; // cap the roll; the rest live behind "See all (N)"

  useEffect(() => {
    if (!circleId) return;
    setLoading(true);
    api
      .getCapsule(circleId)
      .then(setCapsule)
      .catch(() => setCapsule(null))
      .finally(() => setLoading(false));
  }, [circleId]);

  // Real avg rating for the highlight grid — the event's public review aggregate.
  useEffect(() => {
    if (capsule?.eventId) api.getEventReviews(capsule.eventId).then(setReviews).catch(() => {});
  }, [capsule?.eventId]);

  const backArrow = (
    <Pressable
      onPress={() => router.back()}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={t('onb_back')}
    >
      <Text style={styles.back}>←</Text>
    </Pressable>
  );

  // Loading — skeleton (all-states rule), never a blank SafeAreaView.
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandBar />
        <View style={styles.content}>
          {backArrow}
          <View style={styles.skelHero} />
          <View style={[styles.skelLine, styles.skelLineWide]} />
          <View style={[styles.skelLine, styles.skelLineNarrow]} />
        </View>
      </SafeAreaView>
    );
  }

  // Not-found / not-ready — warm + specific (capsules generate hours after the event).
  if (!capsule) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandBar />
        <View style={styles.content}>
          {backArrow}
          <View style={styles.notFound}>
            <Text style={styles.notFoundTitle}>{t('cap_notFoundTitle')}</Text>
            <Text style={styles.notFoundBody}>{t('cap_notFoundBody')}</Text>
            <Pressable
              style={styles.notFoundCta}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t('onb_back')}
            >
              <Text style={styles.notFoundCtaText}>{t('onb_back')}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const dateLine = formatDate(capsule.eventDate, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Real photo-contributor count for the "shared by X of Y people" line — distinct
  // members who actually uploaded a photo. NOT stats.sharedBoth (that counts members
  // with both arriving+leaving pairs, a different number). Anonymous (null) photos
  // aren't attributable, so they don't inflate the count.
  const photoContributors = new Set(
    capsule.photos.map((p) => p.userId).filter((id): id is string => id != null),
  ).size;

  const share = () => {
    void Share.share({
      message: `${t('memoryCapsule')} — ${capsule.eventTitle} · ${dateLine}`,
    });
  };

  const save = async () => {
    if (capsule.heroPhotoUrl) {
      const ok = await savePhotoToDevice(abs(capsule.heroPhotoUrl));
      setSaved(ok);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: navClearance }]}>
        {backArrow}

        {/* Hero */}
        <ImageBackground
          source={capsule.heroPhotoUrl ? { uri: abs(capsule.heroPhotoUrl) } : undefined}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroScrim} />
          <Text style={styles.heroEyebrow}>{t('memoryCapsule').toUpperCase()}</Text>
          <Text style={styles.heroTitle}>{capsule.eventTitle}</Text>
          {/* barri appears once — inside membersLine (was duplicated before the Circle clause) */}
          <Text style={styles.heroMeta}>
            {dateLine} ·{' '}
            {interpolate(t('membersLine'), {
              circle: t('circle'),
              count: String(capsule.stats.members),
              barri: capsule.neighbourhood ?? 'Barcelona',
            })}
          </Text>
        </ImageBackground>

        {/* Featured quote — the top voice from the Circle (empty until reviews land) */}
        {capsule.quotes.length > 0 ? (
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>“{capsule.quotes[0]!.body}”</Text>
            {capsule.quotes[0]!.authorName ? (
              <Text style={styles.quoteAuthor}>{capsule.quotes[0]!.authorName}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Photo roll — grid (every 5th tile spans full-width for rhythm) */}
        {capsule.photos.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.titleRow}>
              <Text style={styles.sectionTitle}>{t('photoRoll')}</Text>
              {capsule.photos.length > PHOTO_PREVIEW ? (
                <Pressable onPress={comingSoon} hitSlop={8}>
                  <Text style={styles.seeAll}>
                    {interpolate(t('seeAll'), { n: String(capsule.photos.length) })}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.grid}>
              {capsule.photos.slice(0, PHOTO_PREVIEW).map((p, i) => (
                <Image
                  key={`${p.url}-${i}`}
                  source={{ uri: abs(p.url) }}
                  style={[styles.gridPhoto, i % 5 === 0 && styles.gridPhotoWide]}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Your Circle — member avatars (member-gated) + still-chatting line */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('yourCircle')}</Text>
          <View style={styles.circleStrip}>
            {capsule.members.length > 0 ? (
              <View style={styles.csAvs}>
                {capsule.members.slice(0, 6).map((m, i) =>
                  m.avatarUrl ? (
                    <Image
                      key={i}
                      source={{ uri: abs(m.avatarUrl) }}
                      style={[styles.csAv, i > 0 && styles.csAvOverlap]}
                    />
                  ) : (
                    <View
                      key={i}
                      style={[styles.csAv, styles.csAvFallback, i > 0 && styles.csAvOverlap]}
                    >
                      <Text style={styles.csAvInitial}>
                        {(m.displayName ?? '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  ),
                )}
              </View>
            ) : null}
            <Text style={styles.circleLine}>
              {interpolate(t('stillChatting'), { n: String(capsule.stats.members) })}
            </Text>
          </View>
        </View>

        {/* The difference — silent, not stigmatised: pairs only, no slots for skippers.
            Rendered ONLY when at least one member submitted both arriving + leaving. */}
        {capsule.differencePairs.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.titleRow}>
              <Text style={styles.sectionTitle}>
                {t('theDifference').split(' ')[0]}{' '}
                <Text style={styles.sectionTitleEm}>
                  {t('theDifference').split(' ').slice(1).join(' ')}
                </Text>
              </Text>
              {/* §10b warmth — the phrase in the other two languages */}
              <Text style={styles.titleAside}>
                {(['ca', 'es', 'en'] as Locale[])
                  .filter((l) => l !== getActiveLocale())
                  .map((l) => t('theDifference', l).toLowerCase())
                  .join(' · ')}
              </Text>
            </View>
            {/* Featured pair (first), full-width with Arriving/Leaving + times */}
            {capsule.differencePairs[0] ? (
              <View style={styles.pairCard}>
                <Text style={styles.pairName}>{capsule.differencePairs[0].displayName ?? '—'}</Text>
                <View style={styles.pairRow}>
                  <View style={styles.pane}>
                    <Image
                      source={{ uri: abs(capsule.differencePairs[0].beforeUrl) }}
                      style={styles.paneImg}
                    />
                    <Text style={styles.paneLabel}>{t('paneArriving')}</Text>
                    <Text style={styles.paneTime}>
                      {formatTime(capsule.differencePairs[0].beforeAt, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.pane}>
                    <Image
                      source={{ uri: abs(capsule.differencePairs[0].afterUrl) }}
                      style={styles.paneImg}
                    />
                    <Text style={styles.paneLabel}>{t('paneLeaving')}</Text>
                    <Text style={styles.paneTime}>
                      {formatTime(capsule.differencePairs[0].afterAt, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Mini-pairs (the rest) — small before/after thumbs */}
            {capsule.differencePairs.length > 1 ? (
              <View style={styles.miniRow}>
                {capsule.differencePairs.slice(1).map((p) => (
                  <View key={p.userId} style={styles.miniCard}>
                    <Image source={{ uri: abs(p.beforeUrl) }} style={styles.miniImg} />
                    <Image source={{ uri: abs(p.afterUrl) }} style={styles.miniImg} />
                    <Text style={styles.miniName}>{p.displayName ?? '—'}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Counts only — silent, not stigmatised (no skipper names) */}
            <Text style={styles.diffFootnote}>
              {interpolate(t('cap_diffFootnote'), {
                x: String(capsule.stats.sharedBoth),
                y: String(capsule.stats.members),
              })}
            </Text>
          </View>
        ) : null}

        {/* Highlights — icon tiles, only the stats we truly have */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('highlights')}</Text>
          <View style={styles.hlGrid}>
            <View style={styles.hlItem}>
              <View style={styles.hlIc}>
                <Camera size={16} color={tokens.color.forest} strokeWidth={2} />
              </View>
              <View style={styles.hlTx}>
                <Text style={styles.hlT}>
                  {interpolate(t('nPhotos'), { n: String(capsule.stats.photos) })}
                </Text>
                <Text style={styles.hlS}>
                  {interpolate(t('sharedBy'), {
                    x: String(photoContributors),
                    y: String(capsule.stats.members),
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.hlItem}>
              <View style={styles.hlIc}>
                <MessageCircle size={16} color={tokens.color.forest} strokeWidth={2} />
              </View>
              <View style={styles.hlTx}>
                <Text style={styles.hlT}>
                  {interpolate(t('nCircleMessages'), { n: String(capsule.stats.messages) })}
                </Text>
                <Text style={styles.hlS}>{t('sinceEnded')}</Text>
              </View>
            </View>
            {/* Real avg rating — Feature C reviews aggregate. Hidden if no public reviews. */}
            {reviews && reviews.count > 0 ? (
              <View style={styles.hlItem}>
                <View style={styles.hlIc}>
                  <Star size={16} color={tokens.color.forest} strokeWidth={2} />
                </View>
                <View style={styles.hlTx}>
                  <Text style={styles.hlT}>
                    {reviews.avgRating} · {t('cap_avgRating')}
                  </Text>
                  <Text style={styles.hlS}>
                    {interpolate(t('cap_wouldGo'), { n: String(reviews.wouldGoAgainCount) })}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Actions — share / save footer */}
        <View style={styles.actions}>
          <Pressable style={styles.cta} onPress={share} accessibilityRole="button">
            <Text style={styles.ctaText}>{t('shareCapsule')}</Text>
          </Pressable>
          <Pressable
            style={styles.ghost}
            onPress={save}
            accessibilityRole="button"
            accessibilityLabel={saved ? t('ep_saved') : t('save')}
          >
            <Text style={styles.ghostText}>{saved ? '✓' : t('save')}</Text>
          </Pressable>
        </View>

        {/* Privacy footnote (§21 verbatim) */}
        <Text style={styles.privacy}>
          {t('capsulePrivacy')} <Text style={styles.privacyLink}>{t('privacyLink')}</Text>
        </Text>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  content: { padding: 16, paddingBottom: 40 },
  back: { fontSize: 22, color: tokens.color.ink, marginBottom: 8 },

  // Loading skeleton
  skelHero: { aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: tokens.color.border },
  skelLine: { height: 14, borderRadius: 6, backgroundColor: tokens.color.border },
  skelLineWide: { width: '60%', marginTop: 16 },
  skelLineNarrow: { width: '40%', marginTop: 8 },

  // Not-found / not-ready
  notFound: { alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, gap: 8 },
  notFoundTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: tokens.color.ink,
    textAlign: 'center',
  },
  notFoundBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: tokens.color.text2,
    textAlign: 'center',
  },
  notFoundCta: {
    marginTop: 8,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
    justifyContent: 'center',
  },
  notFoundCtaText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: tokens.color.ink },

  hero: {
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: tokens.color.forest,
  },
  heroImage: { resizeMode: 'cover' },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(28,28,30,0.35)' },
  heroEyebrow: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: tokens.color.coralSoft,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: -0.5,
    color: tokens.color.cream,
  },
  heroMeta: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(247,243,237,0.85)', marginTop: 4 },
  // Prototype .quote-card: bg2 card, accent left-rule, italic pull-quote + author.
  quoteCard: {
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderLeftColor: tokens.color.coralInk,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  quoteText: {
    fontFamily: fonts.displayItalic,
    fontSize: 15,
    lineHeight: 21,
    color: tokens.color.ink,
  },
  quoteAuthor: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11.5,
    color: tokens.color.text2,
    marginTop: 6,
  },
  section: { marginTop: 24 },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    letterSpacing: -0.3,
    color: tokens.color.ink,
    marginBottom: 12,
  },
  sectionTitleEm: { fontFamily: fonts.displayItalic, color: tokens.color.coralInk },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  titleAside: { fontFamily: fonts.body, fontSize: 10.5, color: tokens.color.text2, marginBottom: 12 },
  seeAll: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: tokens.color.coralInk, marginBottom: 12 },
  pairCard: {
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  pairName: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.ink, marginBottom: 8 },
  pairRow: { flexDirection: 'row', gap: 10 },
  pane: { flex: 1 },
  paneImg: { width: '100%', aspectRatio: 1, borderRadius: 10, backgroundColor: tokens.color.border },
  paneLabel: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 9.5,
    letterSpacing: 1,
    color: tokens.color.coralInk,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  paneTime: { fontFamily: fonts.body, fontSize: 11, color: tokens.color.text2 },

  // Mini-pairs (the difference)
  miniRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniCard: {
    width: '31%',
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
  },
  miniImg: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    backgroundColor: tokens.color.border,
    marginBottom: 3,
  },
  miniName: { fontFamily: fonts.displayItalic, fontSize: 10.5, color: tokens.color.ink, marginTop: 3 },
  diffFootnote: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: tokens.color.text2,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },

  // Photo grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gridPhoto: { width: '48.5%', aspectRatio: 1, borderRadius: 10, backgroundColor: tokens.color.border },
  gridPhotoWide: { width: '100%', aspectRatio: 16 / 9 },

  // Highlights tiles
  hlGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  hlItem: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  hlIc: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.color.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hlTx: { flex: 1 },
  hlT: { fontFamily: fonts.displaySemi, fontSize: 14, color: tokens.color.forest },
  hlS: { fontFamily: fonts.body, fontSize: 10.5, color: tokens.color.text2, marginTop: 1, lineHeight: 14 },

  // Your Circle strip
  circleStrip: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  csAvs: { flexDirection: 'row' },
  csAv: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.color.border,
    borderColor: tokens.color.cream,
    borderWidth: 1.5,
  },
  csAvOverlap: { marginLeft: -8 },
  csAvFallback: { backgroundColor: tokens.color.forestSoft, alignItems: 'center', justifyContent: 'center' },
  csAvInitial: { fontFamily: fonts.displaySemi, fontSize: 12, color: tokens.color.forest },
  circleLine: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.text2, flex: 1 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cta: {
    flex: 1,
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.cream },
  ghost: {
    paddingHorizontal: 22,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ghostText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: tokens.color.ink },
  privacy: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: tokens.color.text2,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 16,
    marginHorizontal: 10,
  },
  privacyLink: { fontFamily: fonts.bodySemi, color: tokens.color.coralInk },
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
