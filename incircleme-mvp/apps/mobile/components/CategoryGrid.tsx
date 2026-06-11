import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { t, type StringKey } from '@incircleme/i18n';
import type { EventCategory } from '@incircleme/types';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// Canonical six (prototype pass 17 taxonomy). Tile tints from the prototype's --cat-* tokens.
const CATEGORIES: { cat: EventCategory; label: StringKey; tint: string }[] = [
  { cat: 'food_drink', label: 'catFoodDrink', tint: '#D4825A' },
  { cat: 'wellness', label: 'catWellness', tint: '#7A8C73' },
  { cat: 'art_craft', label: 'catArtCraft', tint: '#B86040' },
  { cat: 'music', label: 'catMusic', tint: '#8E4530' },
  { cat: 'nature', label: 'catNature', tint: '#4B7A47' },
  { cat: 'learning', label: 'catLearning', tint: '#1C1C1E' },
];

export function CategoryGrid() {
  const router = useRouter();
  return (
    <View style={styles.grid}>
      {CATEGORIES.map(({ cat, label, tint }) => (
        <Pressable
          key={cat}
          style={[styles.tile, { backgroundColor: tint }]}
          onPress={() => router.push(`/category/${cat}`)}
          accessibilityRole="button"
        >
          <Text style={styles.label}>{t(label)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: '31.5%',
    aspectRatio: 1.35,
    borderRadius: 12,
    justifyContent: 'flex-end',
    padding: 9,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    color: tokens.color.cream,
  },
});
