// Event-detail reviews section (Forward-Audit 3b) — visible-trust signal. Read-only; writing
// a review is the post-event flow. Built on the existing aggregate endpoint
// (GET /events/:id/reviews → ReviewAggregate, isPublic-only). Showing individual review TEXT
// would need a new read endpoint + card — deferred (flagged), not faked here.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { REVIEWS } from '@incircleme/config';
import type { ReviewAggregate } from '@incircleme/types';
import { interpolate, t, type StringKey } from '@incircleme/i18n';
import { api } from '../lib/api';
import { ScreenSkeleton, ErrorRetry } from './ScreenStates';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// config vibe keys (snake) → i18n labels (vibe_<camel>)
const VIBE_LABEL: Record<string, StringKey> = {
  warm_welcome: 'vibe_warmWelcome',
  well_organised: 'vibe_wellOrganised',
  small_group: 'vibe_smallGroup',
  beautiful_space: 'vibe_beautifulSpace',
  easy_to_meet: 'vibe_easyToMeet',
  felt_included: 'vibe_feltIncluded',
};

export function EventReviews({ eventId }: { eventId: string }) {
  const [agg, setAgg] = useState<ReviewAggregate | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(() => {
    setStatus('loading');
    api
      .getEventReviews(eventId)
      .then((a) => {
        setAgg(a);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === 'loading') return <ScreenSkeleton />;
  if (status === 'error' || !agg) return <ErrorRetry onRetry={load} />;

  // Warm empty — never a blank.
  if (agg.count === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>{t('evr_title')}</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('evr_emptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('evr_emptyBody')}</Text>
        </View>
      </View>
    );
  }

  // Top vibe tags by count (config order breaks ties), capped at 3.
  const topVibes = REVIEWS.vibeTags
    .map((key) => ({ key, n: agg.tagCounts[key] ?? 0 }))
    .filter((v) => v.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 3);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('evr_title')}</Text>
      <View style={styles.card}>
        <View
          style={styles.ratingRow}
          accessible
          accessibilityRole="text"
          accessibilityLabel={interpolate(t('evr_ratingA11y'), {
            avg: String(agg.avgRating),
            count: String(agg.count),
          })}
        >
          <Star size={20} color={tokens.color.coralInk} fill={tokens.color.coralInk} strokeWidth={0} />
          <Text style={styles.avg}>{agg.avgRating.toFixed(1)}</Text>
          <Text style={styles.count}>{interpolate(t('evr_count'), { count: String(agg.count) })}</Text>
        </View>
        {agg.wouldGoAgainCount > 0 ? (
          <Text style={styles.again}>
            {interpolate(t('evr_wouldGoAgain'), { n: String(agg.wouldGoAgainCount) })}
          </Text>
        ) : null}
        {topVibes.length > 0 ? (
          <View style={styles.tags}>
            {topVibes.map((v) => (
              <View key={v.key} style={styles.tag}>
                <Text style={styles.tagText}>
                  {t(VIBE_LABEL[v.key]!)} · {v.n}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 8 },
  title: { fontFamily: fonts.displaySemi, fontSize: 17, color: tokens.color.ink, marginBottom: 10 },
  card: { backgroundColor: tokens.color.bg2, borderRadius: 16, padding: 16, gap: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // ink on bg2 ≈ 17:1 (AA); star coralInk on bg2 ≈ 4.9:1.
  avg: { fontFamily: fonts.displaySemi, fontSize: 22, color: tokens.color.ink },
  count: { fontFamily: fonts.body, fontSize: 14, color: tokens.color.text2 }, // text2 ≥4.5 (not gray)
  again: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.forest }, // neutral, no goldGlow
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: tokens.color.forestSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontFamily: fonts.bodySemi, fontSize: 11, color: tokens.color.forest }, // forest/forestSoft 8.53
  empty: { backgroundColor: tokens.color.bg2, borderRadius: 16, padding: 18, gap: 4 },
  emptyTitle: { fontFamily: fonts.displaySemi, fontSize: 15, color: tokens.color.ink },
  emptyBody: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: tokens.color.text2 },
});
