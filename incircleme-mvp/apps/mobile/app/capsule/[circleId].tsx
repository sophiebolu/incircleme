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
import type { Capsule } from '@incircleme/types';
import { t, interpolate, formatDate, formatTime } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { savePhotoToDevice } from '../../lib/savePhoto';
import { BrandBar } from '../../components/BrandBar';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const abs = (url: string) => (url.startsWith('http') ? url : `${API_BASE}${url}`);

export default function CapsuleScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const router = useRouter();
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (circleId) api.getCapsule(circleId).then(setCapsule).catch(() => setCapsule(null));
  }, [circleId]);

  if (!capsule) {
    // TODO(deferred, needs copy verdict): explicit not-found / loading empty state.
    return <SafeAreaView style={styles.safe} />;
  }

  const dateLine = formatDate(capsule.eventDate, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>←</Text>
        </Pressable>

        {/* Hero */}
        <ImageBackground
          source={capsule.heroPhotoUrl ? { uri: abs(capsule.heroPhotoUrl) } : undefined}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroScrim} />
          <Text style={styles.heroEyebrow}>{t('memoryCapsule').toUpperCase()}</Text>
          <Text style={styles.heroTitle}>{capsule.eventTitle}</Text>
          <Text style={styles.heroMeta}>
            {dateLine} · {capsule.neighbourhood ?? 'Barcelona'} ·{' '}
            {interpolate(t('membersLine'), {
              circle: t('circle'),
              count: String(capsule.stats.members),
              barri: capsule.neighbourhood ?? 'Barcelona',
            })}
          </Text>
        </ImageBackground>

        {/* The difference — silent, not stigmatised: pairs only, no slots for skippers */}
        {capsule.differencePairs.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('theDifference').split(' ')[0]}{' '}
              <Text style={styles.sectionTitleEm}>
                {t('theDifference').split(' ').slice(1).join(' ')}
              </Text>
            </Text>
            {capsule.differencePairs.map((p) => (
              <View key={p.userId} style={styles.pairCard}>
                <Text style={styles.pairName}>{p.displayName ?? '—'}</Text>
                <View style={styles.pairRow}>
                  <View style={styles.pane}>
                    <Image source={{ uri: abs(p.beforeUrl) }} style={styles.paneImg} />
                    <Text style={styles.paneLabel}>{t('paneArriving')}</Text>
                    <Text style={styles.paneTime}>
                      {formatTime(p.beforeAt, { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.pane}>
                    <Image source={{ uri: abs(p.afterUrl) }} style={styles.paneImg} />
                    <Text style={styles.paneLabel}>{t('paneLeaving')}</Text>
                    <Text style={styles.paneTime}>
                      {formatTime(p.afterAt, { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Photo roll */}
        {capsule.photos.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.rollHeader}>
              <Text style={styles.sectionTitle}>{t('photoRoll')}</Text>
              <Text style={styles.seeAll}>
                {interpolate(t('seeAll'), { n: String(capsule.stats.photos) })}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roll}>
              {capsule.photos.map((p, i) => (
                <Image key={`${p.url}-${i}`} source={{ uri: abs(p.url) }} style={styles.rollPhoto} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Highlights — only stats we truly have */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('highlights')}</Text>
          <View style={styles.statRow}>
            <Text style={styles.statBig}>
              {interpolate(t('nPhotos'), { n: String(capsule.stats.photos) })}
            </Text>
            <Text style={styles.statSub}>
              {interpolate(t('sharedBy'), {
                x: String(capsule.stats.sharedBoth),
                y: String(capsule.stats.members),
              })}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statBig}>
              {interpolate(t('nCircleMessages'), { n: String(capsule.stats.messages) })}
            </Text>
            <Text style={styles.statSub}>{t('sinceEnded')}</Text>
          </View>
        </View>

        {/* Your Circle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('yourCircle')}</Text>
          <Text style={styles.circleLine}>
            {interpolate(t('stillChatting'), { n: String(capsule.stats.members) })}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.cta} onPress={share}>
            <Text style={styles.ctaText}>{t('shareCapsule')}</Text>
          </Pressable>
          <Pressable style={styles.ghost} onPress={save}>
            <Text style={styles.ghostText}>{saved ? '✓' : t('save')}</Text>
          </Pressable>
        </View>

        {/* Privacy footnote (§21 verbatim) */}
        <Text style={styles.privacy}>
          {t('capsulePrivacy')} <Text style={styles.privacyLink}>{t('privacyLink')}</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  content: { padding: 16, paddingBottom: 40 },
  back: { fontSize: 22, color: tokens.color.ink, marginBottom: 8 },
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
  section: { marginTop: 22 },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    letterSpacing: -0.3,
    color: tokens.color.ink,
    marginBottom: 10,
  },
  sectionTitleEm: { fontFamily: fonts.displayItalic, color: tokens.color.coralInk },
  pairCard: {
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
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
  rollHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  seeAll: { fontFamily: fonts.bodyMedium, fontSize: 12, color: tokens.color.coralInk },
  roll: { gap: 8 },
  rollPhoto: { width: 110, height: 110, borderRadius: 12, backgroundColor: tokens.color.border },
  statRow: {
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  statBig: { fontFamily: fonts.displaySemi, fontSize: 16, color: tokens.color.forest },
  statSub: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2, marginTop: 1 },
  circleLine: { fontFamily: fonts.body, fontSize: 13.5, color: tokens.color.text2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
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
    marginTop: 14,
    marginHorizontal: 10,
  },
  privacyLink: { fontFamily: fonts.bodySemi, color: tokens.color.coralInk },
});
