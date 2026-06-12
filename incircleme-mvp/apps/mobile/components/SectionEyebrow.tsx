import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// Prototype .sect-eyebrow: gold-glow pill + gradient hairline trailing right.
export function SectionEyebrow({ label }: { label: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.pill}>
        <Text style={styles.text}>{label.toUpperCase()}</Text>
      </View>
      <LinearGradient
        colors={[tokens.color.goldLine, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
    marginHorizontal: 2,
  },
  pill: {
    backgroundColor: tokens.color.goldGlow,
    borderColor: tokens.color.goldBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  text: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 10,
    letterSpacing: 1,
    color: tokens.color.coralInk,
  },
  line: { flex: 1, height: 1 },
});
