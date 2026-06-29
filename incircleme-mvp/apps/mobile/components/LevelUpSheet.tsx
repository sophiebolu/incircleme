// "How your passport grows" — a real explainer behind the level-up CTA (replaces the old
// comingSoon stub). Lists the tier ladder + what earns progress. Read-only info sheet.
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarCheck, MessageSquare, Sparkles, Users } from 'lucide-react-native';
import type { TrustTier } from '@incircleme/types';
import { t, type StringKey } from '@incircleme/i18n';
import { TierLadder } from './TierLadder';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

const EARN: { key: StringKey; Icon: typeof Users }[] = [
  { key: 'pz_earnAttend', Icon: CalendarCheck },
  { key: 'pz_earnReviews', Icon: MessageSquare },
  { key: 'pz_earnHost', Icon: Sparkles },
  { key: 'pz_earnCircles', Icon: Users },
];

export function LevelUpSheet({
  visible,
  current,
  onClose,
}: {
  visible: boolean;
  current: TrustTier;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel={t('pz_levelUpClose')}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t('pz_levelUpTitle')}</Text>
          <TierLadder current={current} />
          <Text style={styles.intro}>{t('pz_levelUpIntro')}</Text>
          <View style={styles.earnList}>
            {EARN.map(({ key, Icon }) => (
              <View key={key} style={styles.earnRow}>
                <Icon size={16} color={tokens.color.forest} strokeWidth={2} />
                <Text style={styles.earnText}>{t(key)}</Text>
              </View>
            ))}
          </View>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>{t('pz_levelUpClose')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(28,28,30,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: tokens.color.cream, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, gap: 14 },
  title: { fontFamily: fonts.displaySemi, fontSize: 19, color: tokens.color.ink }, // ink/cream ~15:1
  intro: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: tokens.color.text2 }, // 5.08:1
  earnList: { gap: 10 },
  earnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  earnText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: tokens.color.ink }, // ~15:1
  close: { backgroundColor: tokens.color.forest, borderRadius: 999, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  closeText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.cream }, // cream/forest 10.44:1
});
