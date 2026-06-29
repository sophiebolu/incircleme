// A single public review on the event page (Forward-Audit 3b pt2). The comment is UGC —
// rendered as-written, NEVER auto-translated (tap-to-translate is Phase 2).
import { Image, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { REVIEWS } from '@incircleme/config';
import type { PublicReview } from '@incircleme/types';
import { formatDate, interpolate, t, type StringKey } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

const VIBE_LABEL: Record<string, StringKey> = {
  warm_welcome: 'vibe_warmWelcome',
  well_organised: 'vibe_wellOrganised',
  small_group: 'vibe_smallGroup',
  beautiful_space: 'vibe_beautifulSpace',
  easy_to_meet: 'vibe_easyToMeet',
  felt_included: 'vibe_feltIncluded',
};

export function ReviewCard({ review }: { review: PublicReview }) {
  const name = review.author.displayName ?? t('evr_guestName');
  const initial = (name.trim()[0] ?? '·').toUpperCase();
  const date = formatDate(review.createdAt, { day: 'numeric', month: 'short', year: 'numeric' });
  const vibes = review.vibeTags.filter((v) => VIBE_LABEL[v]).slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        {review.author.avatarUrl ? (
          <Image source={{ uri: review.author.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial} allowFontScaling={false}>
              {initial}
            </Text>
          </View>
        )}
        <View style={styles.headText}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View
          style={styles.stars}
          accessible
          accessibilityRole="text"
          accessibilityLabel={interpolate(t('evr_ratingCardA11y'), { rating: String(review.rating) })}
        >
          {Array.from({ length: REVIEWS.ratingMax }).map((_, i) => (
            <Star
              key={i}
              size={13}
              color={tokens.color.coralInk}
              fill={i < review.rating ? tokens.color.coralInk : 'transparent'}
              strokeWidth={i < review.rating ? 0 : 1.6}
            />
          ))}
        </View>
      </View>

      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}

      {(review.wouldGoAgain === true || vibes.length > 0) && (
        <View style={styles.chips}>
          {review.wouldGoAgain === true ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{t('evr_wouldGoAgainChip')}</Text>
            </View>
          ) : null}
          {vibes.map((v) => (
            <View key={v} style={styles.chip}>
              <Text style={styles.chipText}>{t(VIBE_LABEL[v]!)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: tokens.color.bg2, borderRadius: 16, padding: 14, gap: 8, marginTop: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: tokens.color.forestSoft },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: tokens.color.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: fonts.displaySemi, fontSize: 15, color: tokens.color.forest }, // 8.53 on forestSoft
  headText: { flex: 1 },
  name: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.ink }, // ink/bg2 ~17:1
  date: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2 }, // text2/bg2 5.61 (not gray)
  stars: { flexDirection: 'row', gap: 1 }, // coralInk glyphs; row has an a11y label
  comment: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: tokens.color.ink }, // UGC, ~17:1
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: tokens.color.forestSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 11, color: tokens.color.forest }, // forest/forestSoft 8.53, no goldGlow
});
