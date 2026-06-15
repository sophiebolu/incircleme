import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { PublicProgramDetail } from '@incircleme/types';
import { t, interpolate } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { tierColor, tierLabel } from '../../lib/programTier';
import { BrandBar } from '../../components/BrandBar';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

export default function PublicProgram() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [p, setP] = useState<PublicProgramDetail | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (id)
      api
        .getPublicProgram(id)
        .then(setP)
        .catch(() => setMissing(true));
  }, [id]);

  if (missing) return <SafeAreaView style={styles.safe} />;
  if (!p) return <SafeAreaView style={styles.safe} />;

  const weeks = p.timeFrameSessions ?? p.curriculum.length;
  const color = tierColor(p.verifiedTier);
  // Graceful fallback — host display_name is nullable, so never render "—'s signature".
  const hostLabel = p.hostName || t('prog_pub_hostFallback');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={styles.back}>←</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.body}>
        {/* Trust eyebrow + tier badge */}
        <Text style={styles.trustEyebrow}>{t('prog_pub_trustEyebrow')}</Text>
        <View style={[styles.badge, { borderColor: color, alignSelf: 'flex-start' }]}>
          <Text style={[styles.badgeText, { color }]}>{tierLabel(p.verifiedTier)}</Text>
        </View>

        <Text style={styles.title}>{p.title}</Text>
        <Text style={styles.host}>{[p.hostName, p.neighbourhood].filter(Boolean).join(' · ')}</Text>
        {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}

        {/* {n} weeks · what happens */}
        {p.curriculum.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {interpolate(t('prog_pub_weeksWhatHappens'), { n: String(weeks) })}
            </Text>
            {p.curriculum.map((w, i) => (
              <View key={i} style={styles.weekRow}>
                <Text style={styles.weekNum}>{w.week ?? i + 1}</Text>
                <Text style={styles.weekTitle}>{w.title}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* The certificate */}
        <View style={styles.certCard}>
          <Text style={styles.certEyebrow}>{t('prog_pub_certEyebrow')}</Text>
          <Text style={styles.certHead}>{t('prog_pub_realCredential')}</Text>
          <Text style={styles.certBody}>
            {interpolate(t('prog_pub_certExplainer'), { host: hostLabel })}
          </Text>
          {p.assessmentMethod ? <Text style={styles.certBody}>{p.assessmentMethod}</Text> : null}
          {p.verifiedTier === 'accredited' && p.governingBodyUrl ? (
            <Text style={[styles.certLink, { color }]}>{p.governingBodyUrl}</Text>
          ) : null}
          <Text style={styles.certLink}>{t('prog_pub_howVerification')}</Text>
        </View>

        {/* What's included */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('prog_pub_whatsIncluded')}</Text>
          <Text style={styles.bullet}>• {t('prog_pub_certEyebrow')}</Text>
          {p.timeFrameSessions != null && p.timeFrameTotalHours != null ? (
            <Text style={styles.bullet}>
              •{' '}
              {interpolate(t('prog_pub_scheduleLine'), {
                weeks: String(p.timeFrameSessions),
                hours: String(p.timeFrameTotalHours),
              })}
            </Text>
          ) : null}
        </View>

        {/* Voices from past cohorts */}
        {p.voices.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('prog_pub_voices')}</Text>
            <Text style={styles.sectionSub}>{t('prog_pub_voicesSub')}</Text>
            {p.voices.map((v) => (
              <View key={v.id} style={styles.voiceCard}>
                <Text style={styles.voiceQuote}>“{v.quote}”</Text>
                <Text style={styles.voiceAttr}>{v.attribution}</Text>
                {v.cohortLabel ? <Text style={styles.voiceSub}>{v.cohortLabel}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Questions from neighbours (read-only) */}
        {p.questions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('prog_pub_questions')}</Text>
            <Text style={styles.sectionSub}>
              {interpolate(t('prog_pub_questionsSub'), { host: hostLabel })}
            </Text>
            {p.questions.map((q) => (
              <View key={q.id} style={styles.qaCard}>
                <Text style={styles.qName}>{q.askerName}</Text>
                <Text style={styles.qText}>{q.question}</Text>
                {q.answer ? (
                  <View style={styles.answer}>
                    <Text style={styles.aName}>{hostLabel}</Text>
                    <Text style={styles.aText}>{q.answer}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  back: { fontSize: 22, color: tokens.color.ink, paddingHorizontal: 16, paddingTop: 8 },
  body: { padding: 16, paddingBottom: 40, gap: 6 },
  trustEyebrow: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.color.text2,
  },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, marginTop: 6 },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 10.5 },
  title: { fontFamily: fonts.display, fontSize: 26, color: tokens.color.ink, marginTop: 8 },
  host: { fontFamily: fonts.bodyMedium, fontSize: 13, color: tokens.color.text2, marginTop: 2 },
  desc: { fontFamily: fonts.body, fontSize: 14.5, color: tokens.color.ink, marginTop: 10, lineHeight: 21 },
  section: { marginTop: 22 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 19, color: tokens.color.ink },
  sectionSub: { fontFamily: fonts.body, fontSize: 12.5, color: tokens.color.text2, marginTop: 2, marginBottom: 6 },
  weekRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 10 },
  weekNum: { fontFamily: fonts.displaySemi, fontSize: 15, color: tokens.color.coralInk, width: 18 },
  weekTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: tokens.color.ink, flexShrink: 1 },
  certCard: {
    marginTop: 22,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.goldBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 7,
  },
  certEyebrow: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: tokens.color.goldDeep,
  },
  certHead: { fontFamily: fonts.display, fontSize: 17, color: tokens.color.ink },
  certBody: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.text2, lineHeight: 19 },
  certLink: { fontFamily: fonts.bodySemi, fontSize: 12, color: tokens.color.coralInk, marginTop: 2 },
  bullet: { fontFamily: fonts.body, fontSize: 14, color: tokens.color.ink, marginTop: 6 },
  voiceCard: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  voiceQuote: { fontFamily: fonts.displayItalic, fontSize: 15, color: tokens.color.ink, lineHeight: 22 },
  voiceAttr: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: tokens.color.ink, marginTop: 8 },
  voiceSub: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2, marginTop: 1 },
  qaCard: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  qName: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: tokens.color.coralInk },
  qText: { fontFamily: fonts.body, fontSize: 14, color: tokens.color.ink, marginTop: 3, lineHeight: 20 },
  answer: { marginTop: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: tokens.color.forestSoft },
  aName: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: tokens.color.forest },
  aText: { fontFamily: fonts.body, fontSize: 13.5, color: tokens.color.ink, marginTop: 2, lineHeight: 20 },
});
