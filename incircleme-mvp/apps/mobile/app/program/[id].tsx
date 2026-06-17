import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BadgeCheck, Check, ChevronRight, Share2 } from 'lucide-react-native';
import type { PublicProgramDetail } from '@incircleme/types';
import { formatDate, interpolate, t } from '@incircleme/i18n';
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
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (id)
      api
        .getPublicProgram(id)
        .then(setP)
        .catch(() => setMissing(true));
  }, [id]);

  // TODO(deferred, needs copy verdict): explicit not-found vs loading empty states.
  if (missing) return <SafeAreaView style={styles.safe} />;
  if (!p) return <SafeAreaView style={styles.safe} />;

  const weeks = p.timeFrameSessions ?? p.curriculum.length;
  const color = tierColor(p.verifiedTier);
  // Graceful fallback — host display_name is nullable, so never render "—'s signature".
  const hostLabel = p.hostName || t('prog_pub_hostFallback');
  const hostInitial = (p.hostName || '?').charAt(0).toUpperCase();
  const dayMonth = (iso: string) => formatDate(iso, { day: 'numeric', month: 'short' });

  // Host profile (passport) is Tier 3 — surface a brief "coming soon".
  const comingSoon = () => {
    setNotice(t('prof_comingSoon'));
    setTimeout(() => setNotice(null), 1800);
  };
  const share = () => {
    void Share.share({ message: `${p.title} · ${tierLabel(p.verifiedTier)} · IncircleMe` });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Pressable onPress={share} hitSlop={10}>
          <Share2 size={20} color={tokens.color.ink} strokeWidth={2} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {/* Placeholder hero (branded; real program images are a later coherent pass) */}
        <View style={styles.hero}>
          <View style={[styles.heroBadge, { borderColor: color }]}>
            <BadgeCheck size={13} color={color} strokeWidth={2} />
            <Text style={[styles.heroBadgeText, { color }]}>{tierLabel(p.verifiedTier)}</Text>
          </View>
          <View>
            {p.neighbourhood ? <Text style={styles.heroEyebrow}>{p.neighbourhood}</Text> : null}
            <Text style={styles.heroTitle}>{p.title}</Text>
          </View>
        </View>

        {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}

        {/* Host row — tenure + rooms; tappable to the (Tier 3) passport */}
        <Pressable style={styles.hostRow} onPress={comingSoon}>
          {p.hostAvatarUrl ? (
            <Image source={{ uri: p.hostAvatarUrl }} style={styles.hostAv} />
          ) : (
            <View style={[styles.hostAv, styles.hostAvFallback]}>
              <Text style={styles.hostAvInitial}>{hostInitial}</Text>
            </View>
          )}
          <View style={styles.hostInfo}>
            <Text style={styles.hostName}>{hostLabel}</Text>
            {p.hostJoinedAt ? (
              <Text style={styles.hostMeta}>
                {interpolate(t('prog_pub_hostMeta'), {
                  year: String(new Date(p.hostJoinedAt).getFullYear()),
                  n: String(p.hostEventsHosted),
                })}
              </Text>
            ) : null}
          </View>
          <ChevronRight size={18} color={tokens.color.gray} strokeWidth={2} />
        </Pressable>

        {/* {n} weeks · what happens (+ optional per-week prose) */}
        {p.curriculum.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {interpolate(t('prog_pub_weeksWhatHappens'), { n: String(weeks) })}
            </Text>
            {p.curriculum.map((w, i) => (
              <View key={i} style={styles.weekRow}>
                <Text style={styles.weekNum}>{w.week ?? i + 1}</Text>
                <View style={styles.weekBody}>
                  <Text style={styles.weekTitle}>{w.title}</Text>
                  {w.description ? <Text style={styles.weekDesc}>{w.description}</Text> : null}
                </View>
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

        {/* What's included (derived) */}
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
                <View style={styles.voiceFoot}>
                  <View style={styles.initAv}>
                    <Text style={styles.initAvText}>
                      {(v.attribution || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.voiceMeta}>
                    <Text style={styles.voiceAttr}>{v.attribution}</Text>
                    {v.cohortLabel ? <Text style={styles.voiceSub}>{v.cohortLabel}</Text> : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Quiet questions — static FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('prog_pub_quietQuestions')}</Text>
          <View style={styles.faqCard}>
            <Text style={styles.faqQ}>{t('prog_pub_faqMissQ')}</Text>
            <Text style={styles.faqA}>{t('prog_pub_faqMissA')}</Text>
            <Text style={styles.faqQ}>{t('prog_pub_faqBeginnerQ')}</Text>
            <Text style={styles.faqA}>{t('prog_pub_faqBeginnerA')}</Text>
            <Text style={styles.faqQ}>{t('prog_pub_faqRefundQ')}</Text>
            <Text style={[styles.faqA, styles.faqLast]}>{t('prog_pub_faqRefundA')}</Text>
          </View>
        </View>

        {/* Questions from neighbours (read-only; composer deferred) */}
        {p.questions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('prog_pub_questions')}</Text>
            <Text style={styles.sectionSub}>
              {interpolate(t('prog_pub_questionsSub'), { host: hostLabel })}
            </Text>
            {p.questions.map((q) => (
              <View key={q.id} style={styles.qaCard}>
                <View style={styles.qaHead}>
                  <View style={styles.initAvSm}>
                    <Text style={styles.initAvTextSm}>
                      {(q.askerName || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.qName}>{q.askerName}</Text>
                  <Text style={styles.qaTime}>{dayMonth(q.askedAt)}</Text>
                </View>
                <Text style={styles.qText}>{q.question}</Text>
                {q.answer ? (
                  <View style={styles.answer}>
                    <View style={styles.qaHead}>
                      <Text style={styles.aName}>{hostLabel}</Text>
                      <View style={styles.hostBadge}>
                        <Check size={9} color={tokens.color.forest} strokeWidth={3} />
                        <Text style={styles.hostBadgeText}>{t('prog_pub_hostBadge')}</Text>
                      </View>
                      {q.answeredAt ? (
                        <Text style={styles.qaTime}>{dayMonth(q.answeredAt)}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.aText}>{q.answer}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  back: { fontSize: 22, color: tokens.color.ink },
  body: { padding: 16, paddingBottom: 40, gap: 6 },

  // Placeholder hero
  hero: {
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: tokens.color.forest,
    padding: 16,
    justifyContent: 'space-between',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: tokens.color.cream,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  heroBadgeText: { fontFamily: fonts.bodySemi, fontSize: 10.5 },
  heroEyebrow: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.color.coralSoft,
    marginBottom: 2,
  },
  heroTitle: { fontFamily: fonts.display, fontSize: 28, letterSpacing: -0.5, color: tokens.color.cream },

  desc: { fontFamily: fonts.body, fontSize: 14.5, color: tokens.color.ink, marginTop: 12, lineHeight: 21 },

  // Host row
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.color.forestSoft,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  hostAv: { width: 44, height: 44, borderRadius: 22, backgroundColor: tokens.color.border },
  hostAvFallback: { backgroundColor: tokens.color.forest, alignItems: 'center', justifyContent: 'center' },
  hostAvInitial: { fontFamily: fonts.displaySemi, fontSize: 18, color: tokens.color.cream },
  hostInfo: { flex: 1, gap: 1 },
  hostName: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: tokens.color.ink },
  hostMeta: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2 },

  section: { marginTop: 22 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 19, color: tokens.color.ink },
  sectionSub: { fontFamily: fonts.body, fontSize: 12.5, color: tokens.color.text2, marginTop: 2, marginBottom: 6 },

  weekRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 12 },
  weekNum: { fontFamily: fonts.displaySemi, fontSize: 15, color: tokens.color.coralInk, width: 18 },
  weekBody: { flex: 1, gap: 3 },
  weekTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.ink },
  weekDesc: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.text2, lineHeight: 19 },

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
  voiceFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  voiceMeta: { flex: 1 },
  voiceAttr: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: tokens.color.ink },
  voiceSub: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2, marginTop: 1 },
  initAv: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: tokens.color.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initAvText: { fontFamily: fonts.displaySemi, fontSize: 13, color: tokens.color.forest },

  // FAQ
  faqCard: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  faqQ: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.ink },
  faqA: { fontFamily: fonts.body, fontSize: 12.5, color: tokens.color.text2, lineHeight: 18, marginTop: 2, marginBottom: 10 },
  faqLast: { marginBottom: 0 },

  // Q&A
  qaCard: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  qaHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  initAvSm: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: tokens.color.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initAvTextSm: { fontFamily: fonts.displaySemi, fontSize: 11, color: tokens.color.forest },
  qName: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: tokens.color.coralInk, flex: 1 },
  qaTime: { fontFamily: fonts.body, fontSize: 10.5, color: tokens.color.text2 },
  qText: { fontFamily: fonts.body, fontSize: 14, color: tokens.color.ink, marginTop: 6, lineHeight: 20 },
  answer: { marginTop: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: tokens.color.forestSoft },
  aName: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: tokens.color.forest },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: tokens.color.forestSoft,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hostBadgeText: { fontFamily: fonts.bodySemi, fontSize: 9.5, color: tokens.color.forest },
  aText: { fontFamily: fonts.body, fontSize: 13.5, color: tokens.color.ink, marginTop: 4, lineHeight: 20 },

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
    marginTop: 16,
  },
});
