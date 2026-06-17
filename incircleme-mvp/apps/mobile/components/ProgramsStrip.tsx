import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, GraduationCap } from 'lucide-react-native';
import type { PublicProgramCard } from '@incircleme/types';
import { interpolate, t } from '@incircleme/i18n';
import { api } from '../lib/api';
import { tierColor, tierLabel } from '../lib/programTier';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// Per-card meta — sessions surfaced as "weeks" (§32). Singular when n === 1.
function weeksLabel(sessions: number): string {
  return interpolate(t(sessions === 1 ? 'prog_pub_week' : 'prog_pub_weeks'), {
    n: String(sessions),
  });
}

// Home strip — surfaces verified Programs (§24). Tap a card → public detail;
// the eyebrow + "more" arrow → the full listing. Hidden until ≥1 Program verified.
export function ProgramsStrip() {
  const router = useRouter();
  const [programs, setPrograms] = useState<PublicProgramCard[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .listPublicPrograms()
      .then(setPrograms)
      .catch(() => setPrograms([]));
  }, []);

  // "How it works" → verification flow is Tier 3; surface a brief "coming soon".
  const comingSoon = () => {
    setNotice(t('prof_comingSoon'));
    setTimeout(() => setNotice(null), 1800);
  };

  if (!programs || programs.length === 0) return null;

  // Locked eyebrow (§24) is one string — split its label from the tagline so each
  // half keeps the prototype's distinct styling (bold ink · italic coral).
  const [eyebrowLabel, ...eyebrowRest] = t('prog_pub_eyebrow').split('. ');
  const tagline = eyebrowRest.join('. ');

  const browse = () => router.push('/programs/browse');

  return (
    <View>
      <Pressable style={styles.eyebrowRow} onPress={browse}>
        <View style={styles.ebIcon}>
          <GraduationCap size={11} color={tokens.color.goldDeep} strokeWidth={2.2} />
        </View>
        <Text style={styles.ebLabel}>{eyebrowLabel}.</Text>
        {tagline ? <Text style={styles.ebTagline}>{tagline}</Text> : null}
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {programs.map((p) => (
          <Pressable key={p.id} style={styles.card} onPress={() => router.push(`/program/${p.id}`)}>
            <View style={styles.photo}>
              <View style={[styles.badge, { borderColor: tierColor(p.verifiedTier) }]}>
                <Text style={[styles.badgeText, { color: tierColor(p.verifiedTier) }]}>
                  {tierLabel(p.verifiedTier)}
                </Text>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {p.title}
            </Text>
            <Text style={styles.host} numberOfLines={1}>
              {[p.hostName, p.neighbourhood].filter(Boolean).join(' · ')}
            </Text>
            {p.timeFrameSessions != null ? (
              <Text style={styles.weeks}>{weeksLabel(p.timeFrameSessions)}</Text>
            ) : null}
          </Pressable>
        ))}

        {/* See-all arrow card at the strip end */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('prog_pub_moreCard')}
          onPress={browse}
        >
          <LinearGradient
            colors={['rgba(229,183,61,0.14)', 'rgba(229,183,61,0.24)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.arrowCard}
          >
            <View style={styles.arrowCircle}>
              <ArrowRight size={16} color={tokens.color.gold} strokeWidth={2.4} />
            </View>
            <Text style={styles.arrowLabel}>{t('prog_pub_moreCard')}</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>

      <Text style={styles.trust}>
        {t('prog_pub_trustLine')}{' '}
        <Text style={styles.howItWorks} onPress={comingSoon}>
          {t('prog_pub_howItWorks')}
        </Text>
      </Text>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ebIcon: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: tokens.color.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  ebLabel: { fontFamily: fonts.displaySemi, fontSize: 15, color: tokens.color.ink },
  ebTagline: {
    fontFamily: fonts.displayItalic,
    fontSize: 13.5,
    color: tokens.color.coralInk,
    marginLeft: 6,
  },
  row: { gap: 10, paddingRight: 16, alignItems: 'stretch' },
  card: { width: 150 },
  photo: {
    width: 150,
    height: 96,
    borderRadius: 12,
    backgroundColor: tokens.color.forestSoft,
    marginBottom: 6,
    padding: 7,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
  },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 9.5 },
  title: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.ink },
  host: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2, marginTop: 2 },
  weeks: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 0.2,
    color: tokens.color.text2,
    marginTop: 5,
  },
  arrowCard: {
    width: 76,
    height: '100%',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(229,183,61,0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLabel: {
    fontFamily: fonts.displayItalic,
    fontSize: 11,
    color: tokens.color.goldDeep,
    textAlign: 'center',
  },
  trust: { fontFamily: fonts.body, fontSize: 11, color: tokens.color.text2, marginTop: 10 },
  howItWorks: { fontFamily: fonts.bodyMedium, color: tokens.color.coralInk },
  notice: { fontFamily: fonts.body, fontSize: 11, color: tokens.color.coralInk, marginTop: 6 },
});
