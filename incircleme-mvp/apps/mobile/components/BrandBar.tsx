import { StyleSheet, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// Prototype .brandbar (present on ~all screens): Fraunces wordmark left,
// italic-coral "Me" accent; bell on Home. Badge omitted until the
// notifications endpoint exists — no fake counts.
export function BrandBar({ bell = false }: { bell?: boolean }) {
  return (
    <View style={styles.bar}>
      <Text style={styles.brand}>
        Incircle
        <Text style={styles.accent}>Me</Text>
      </Text>
      {bell ? <Bell size={18} color={tokens.color.ink} strokeWidth={2} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 18,
  },
  brand: {
    fontFamily: fonts.displaySemi,
    fontSize: 19,
    letterSpacing: -0.34,
    color: tokens.color.ink,
  },
  accent: {
    fontFamily: fonts.displayItalic,
    color: tokens.color.coral,
  },
});
