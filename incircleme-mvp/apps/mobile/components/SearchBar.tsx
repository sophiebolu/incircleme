import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { t } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// Prototype .search: readonly field — the whole bar is a button that routes to the
// events feed (date filters live there, not behind free-text; Pass 22 rule).
export function SearchBar() {
  const router = useRouter();
  return (
    <Pressable
      style={styles.bar}
      onPress={() => router.push('/category/all')}
      accessibilityRole="search"
      accessibilityLabel={t('searchPlaceholder')}
    >
      <Search size={15} color={tokens.color.gray} strokeWidth={2} />
      <Text style={styles.placeholder}>{t('searchPlaceholder')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 13,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 8,
  },
  placeholder: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: tokens.color.text2,
  },
});
