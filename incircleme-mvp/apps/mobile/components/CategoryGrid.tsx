import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  UtensilsCrossed,
  HeartPulse,
  Palette,
  Music2,
  Trees,
  BookOpen,
  type LucideIcon,
} from 'lucide-react-native';
import { t, type StringKey } from '@incircleme/i18n';
import type { EventCategory } from '@incircleme/types';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// Prototype .cat-tile: white card, 36x36 tinted icon square, Fraunces 12 label.
// Tint alternation and lucide icons match the prototype markup exactly.
const TILES: {
  cat: EventCategory;
  label: StringKey;
  Icon: LucideIcon;
  tint: 'coral' | 'forest';
}[] = [
  { cat: 'food_drink', label: 'catFoodDrink', Icon: UtensilsCrossed, tint: 'coral' },
  { cat: 'wellness', label: 'catWellness', Icon: HeartPulse, tint: 'forest' },
  { cat: 'art_craft', label: 'catArtCraft', Icon: Palette, tint: 'coral' },
  { cat: 'music', label: 'catMusic', Icon: Music2, tint: 'forest' },
  { cat: 'nature', label: 'catNature', Icon: Trees, tint: 'forest' },
  { cat: 'learning', label: 'catLearning', Icon: BookOpen, tint: 'coral' },
];

const TINT = {
  coral: { bg: 'rgba(166,86,58,0.10)', fg: tokens.color.coral },
  forest: { bg: 'rgba(61,92,74,0.10)', fg: tokens.color.forest },
} as const;

export function CategoryGrid() {
  const router = useRouter();
  return (
    <View style={styles.grid}>
      {TILES.map(({ cat, label, Icon, tint }) => (
        <Pressable
          key={cat}
          style={styles.tile}
          onPress={() => router.push(`/category/${cat}`)}
          accessibilityRole="button"
        >
          <View style={[styles.cic, { backgroundColor: TINT[tint].bg }]}>
            <Icon size={18} color={TINT[tint].fg} strokeWidth={2} />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {t(label)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 6,
  },
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 7,
  },
  cic: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: -0.06,
    color: tokens.color.ink,
  },
});
