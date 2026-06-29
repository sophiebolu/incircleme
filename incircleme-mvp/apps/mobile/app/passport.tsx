import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BadgeCheck,
  CalendarCheck,
  Lock,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import type { PassportSummary } from '@incircleme/types';
import { formatDate, interpolate, t } from '@incircleme/i18n';
import { api } from '../lib/api';
import { hasNoActivity, tierLabel } from '../lib/trustTier';
import { showVerifiedBadge } from '../lib/verifiedBadge';
import { BrandBar } from '../components/BrandBar';
import { TierLadder } from '../components/TierLadder';
import { LevelUpSheet } from '../components/LevelUpSheet';
import { ScreenSkeleton, ErrorRetry } from '../components/ScreenStates';
import { useNavClearance } from '../lib/useNavClearance';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

const TRAITS: { key: 'pp_reliable' | 'pp_hospitable' | 'pp_curious' }[] = [
  { key: 'pp_reliable' },
  { key: 'pp_hospitable' },
  { key: 'pp_curious' },
];

export default function PassportScreen() {
  const router = useRouter();
  const [pp, setPp] = useState<PassportSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const navClearance = useNavClearance();

  const load = useCallback(() => {
    setStatus('loading');
    api
      .getPassport()
      .then((p) => {
        setPp(p);
        setStatus('ready');
      })
      .catch(() => setStatus('error')); // the caller's passport always exists → failure = error, not not-found
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status !== 'ready' || !pp) {
    // Shared blank-state pattern (S2) — no bare SafeAreaView shell.
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandBar />
        {status === 'loading' ? <ScreenSkeleton /> : <ErrorRetry onRetry={load} />}
      </SafeAreaView>
    );
  }

  const memberSince = interpolate(t('prof_joined'), {
    date: formatDate(pp.joinedAt, { month: 'long', year: 'numeric' }),
  });
  const r = pp.reviewsReceived;
  const zero = hasNoActivity(pp); // brand-new passport → warm first-state, not cold 0/—

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={styles.back}>←</Text>
      </Pressable>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: navClearance }]}>
        {/* Passport card — tier WORD (shared); the NUMBERS below are self-only */}
        <View style={styles.card}>
          <View style={styles.capRow}>
            <Text style={styles.capTitle}>
              {t('prof_passport').split(' ')[0]}{' '}
              <Text style={styles.capTitleEm}>
                {t('prof_passport').split(' ').slice(1).join(' ')}
              </Text>
            </Text>
            <Text style={styles.tier}>{tierLabel(pp.trustTier)}</Text>
          </View>
          <Text style={styles.name}>{pp.displayName ?? '—'}</Text>
          <Text style={styles.member}>
            {memberSince}
            {pp.neighbourhood ? ` · ${pp.neighbourhood}` : ''}
          </Text>

          {/* Trait rings — scores not computed yet (Tier 3): honest "—" stubs. Hidden for a
              brand-new user (the warm first-state leads instead of empty rings). */}
          {!zero ? (
            <>
              <View style={styles.rings}>
                {TRAITS.map((tr) => (
                  <View key={tr.key} style={styles.ring}>
                    <View style={styles.donut}>
                      <Text style={styles.donutVal}>—</Text>
                    </View>
                    <Text style={styles.ringLabel}>{t(tr.key)}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.traitNote}>{t('pp_traitsSoon')}</Text>
            </>
          ) : null}
        </View>

        {zero ? (
          /* Warm first-state: the ladder as an invitation (you're at the start), not a 0/— deficit. */
          <View style={styles.zeroBlock}>
            <TierLadder current={pp.trustTier} />
            <Text style={styles.zeroTitle}>{t('pz_zeroTitle')}</Text>
            <Text style={styles.zeroBody}>{t('pz_zeroBody')}</Text>
            <Text style={styles.zeroAction}>{t('pz_firstAction')}</Text>
          </View>
        ) : (
          <>
            {/* How your score is built — only the rows we truly have data for */}
            <Text style={styles.sectionLabel}>{t('pp_scoreBuilt')}</Text>

            <StatRow
              icon={<MessageSquare size={16} color={tokens.color.forest} strokeWidth={2} />}
              title={t('pp_reviewsReceived')}
              sub={interpolate(t('pp_reviewsSub'), {
                avg: String(r.avgRating),
                again: String(r.wouldGoAgainCount),
                incl: String(r.feltIncludedCount),
              })}
              value={r.count > 0 ? String(r.avgRating) : '—'}
            />
            <StatRow
              icon={<Users size={16} color={tokens.color.forest} strokeWidth={2} />}
              title={t('pp_circlesActive')}
              value={String(pp.activeCircles)}
            />
            <StatRow
              icon={<BadgeCheck size={16} color={tokens.color.forest} strokeWidth={2} />}
              title={t('pp_contributions')}
              sub={interpolate(t('pp_contributionsSub'), { n: String(pp.reviewsGiven) })}
              value={String(pp.reviewsGiven)}
            />
            <StatRow
              icon={<CalendarCheck size={16} color={tokens.color.forest} strokeWidth={2} />}
              title={t('prof_statAttended')}
              value={String(pp.attended)}
            />
          </>
        )}

        {/* Badges. The verified badge now gates on pp.verified — same signal the profile /
            public-profile / HostRow surfaces use — so an unverified user no longer sees a false
            "verified". (Today users.verified is account-level; real identity verification is §E
            future work — see lib/verifiedBadge.) */}
        <Text style={styles.sectionLabel}>{t('pp_badges')}</Text>
        <View style={styles.badgeRow}>
          {showVerifiedBadge(pp) ? (
            <View style={[styles.badge, styles.badgeEarned]}>
              <ShieldCheck size={18} color={tokens.color.forest} strokeWidth={2} />
              <Text style={styles.badgeText}>{t('prof_verified')}</Text>
            </View>
          ) : null}
          <View style={styles.badge}>
            <Lock size={16} color={tokens.color.gray} strokeWidth={2} />
            <Text style={styles.badgeTextLocked}>{t('pp_badgesSoon')}</Text>
          </View>
        </View>

        {/* Why this matters */}
        <Text style={styles.sectionLabel}>{t('pp_whyMatters')}</Text>
        <View style={styles.whyCard}>
          <Text style={styles.whyBody}>{t('pp_whyMattersBody')}</Text>
          <View style={styles.whyFoot}>
            <Lock size={12} color={tokens.color.coralInk} strokeWidth={2} />
            <Text style={styles.whyFootText}>{t('pp_privateDefault')}</Text>
          </View>
        </View>

        {/* Level-up CTA opens the real explainer sheet. The old "Privacy" stub was removed —
            there's no privacy screen to honour it, and the "private by default" note above
            already states the posture (a button that does nothing is a broken promise). */}
        <View style={styles.actions}>
          <Pressable
            style={styles.cta}
            onPress={() => setLevelUpOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('pp_levelUp')}
          >
            <TrendingUp size={15} color={tokens.color.cream} strokeWidth={2} />
            <Text style={styles.ctaText}>{t('pp_levelUp')}</Text>
          </Pressable>
        </View>
      </ScrollView>
      <LevelUpSheet visible={levelUpOpen} current={pp.trustTier} onClose={() => setLevelUpOpen(false)} />
    </SafeAreaView>
  );
}

function StatRow({
  icon,
  title,
  sub,
  value,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  value: string;
}) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statIc}>{icon}</View>
      <View style={styles.statBody}>
        <Text style={styles.statTitle}>{title}</Text>
        {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  back: { fontSize: 22, color: tokens.color.ink, paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, gap: 8 },

  card: {
    backgroundColor: tokens.color.forest,
    borderRadius: 18,
    padding: 16,
  },
  capRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  capTitle: { fontFamily: fonts.display, fontSize: 18, color: tokens.color.cream },
  capTitleEm: { fontFamily: fonts.displayItalic, color: tokens.color.coralSoft },
  tier: { fontFamily: fonts.bodySemi, fontSize: 12, color: tokens.color.coralSoft },
  name: { fontFamily: fonts.displaySemi, fontSize: 20, color: tokens.color.cream, marginTop: 10 },
  member: { fontFamily: fonts.body, fontSize: 11.5, color: 'rgba(247,243,237,0.78)', marginTop: 2 },
  rings: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  ring: { alignItems: 'center', gap: 6 },
  donut: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'rgba(247,243,237,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutVal: { fontFamily: fonts.displaySemi, fontSize: 16, color: tokens.color.cream },
  ringLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: tokens.color.cream },
  traitNote: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: 'rgba(247,243,237,0.6)',
    textAlign: 'center',
    marginTop: 10,
  },

  sectionLabel: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 10,
    letterSpacing: 1,
    color: tokens.color.coralInk,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  statIc: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: tokens.color.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBody: { flex: 1, gap: 1 },
  statTitle: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: tokens.color.ink },
  statSub: { fontFamily: fonts.body, fontSize: 11, color: tokens.color.text2, lineHeight: 15 },
  statValue: { fontFamily: fonts.displaySemi, fontSize: 18, color: tokens.color.forest },

  badgeRow: { flexDirection: 'row', gap: 10 },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  badgeEarned: { backgroundColor: tokens.color.forestSoft, borderColor: tokens.color.forestSoft },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 12, color: tokens.color.forest, flexShrink: 1 },
  badgeTextLocked: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: tokens.color.text2, flexShrink: 1 },

  whyCard: {
    backgroundColor: tokens.color.goldGlow,
    borderColor: tokens.color.goldBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  whyBody: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 19, color: tokens.color.ink },
  whyFoot: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  whyFootText: { fontFamily: fonts.bodySemi, fontSize: 11, color: tokens.color.coralInk },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingVertical: 12,
  },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: tokens.color.cream },

  // Warm zero-activity first-state. ink/cream ~15:1, text2/cream 5.08:1, forest/cream 9.44:1 — all AA.
  zeroBlock: { gap: 10, marginTop: 2 },
  zeroTitle: { fontFamily: fonts.displaySemi, fontSize: 17, color: tokens.color.ink, marginTop: 8 },
  zeroBody: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: tokens.color.text2 },
  zeroAction: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: tokens.color.forest },
});
