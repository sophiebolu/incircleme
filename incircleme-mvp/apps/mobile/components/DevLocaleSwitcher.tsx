import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { getActiveLocale, setActiveLocale, type Locale } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// DEV-ONLY floating review switch (EN · CA · ES). Returns null in production.
// Pinned to the right edge, out of the brand bar's and tab bar's way.
const OPTIONS: Locale[] = ['en', 'ca', 'es'];

export function DevLocaleSwitcher() {
  if (!__DEV__) return null;
  const current = getActiveLocale();

  const pick = (locale: Locale) => {
    if (Platform.OS === 'web' && globalThis.location) {
      // Reload the SAME route with ?lang= — expo-router web is URL-driven, so you
      // stay on the screen and the whole tree re-reads the locale before paint.
      const url = new URL(globalThis.location.href);
      url.searchParams.set('lang', locale);
      globalThis.location.href = url.toString();
      return;
    }
    setActiveLocale(locale); // native: the Stack key in _layout remounts the screen
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.pill}>
        {OPTIONS.map((l) => (
          <Pressable
            key={l}
            onPress={() => pick(l)}
            style={[styles.chip, l === current && styles.chipOn]}
          >
            <Text style={[styles.txt, l === current && styles.txtOn]}>{l.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 6,
    top: '42%',
    zIndex: 9999,
  },
  pill: {
    backgroundColor: 'rgba(28,28,30,0.82)',
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  chip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 },
  chipOn: { backgroundColor: tokens.color.coral },
  txt: { fontFamily: fonts.bodyHeavy, fontSize: 9.5, color: 'rgba(247,243,237,0.75)' },
  txtOn: { color: tokens.color.cream },
});
