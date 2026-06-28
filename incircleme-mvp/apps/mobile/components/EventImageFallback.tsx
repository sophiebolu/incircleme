// Branded fallback for events with no photo — a warm forestSoft ground + the IncircleMe
// monogram, instead of an empty grey box or a generic stock image. Used on the ticket hero
// and the bookings thumbnail. Decorative (the screen overlays the real title for AA).
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

export function EventImageFallback({
  style,
  size = 20,
}: {
  style?: StyleProp<ViewStyle>;
  size?: number;
}) {
  return (
    <View style={[styles.ground, style]} accessible={false}>
      <Text style={[styles.mark, { fontSize: size }]} allowFontScaling={false} numberOfLines={1}>
        Incircle<Text style={styles.me}>Me</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ground: {
    backgroundColor: tokens.color.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mark: { fontFamily: fonts.displaySemi, letterSpacing: -0.3, color: tokens.color.forest, opacity: 0.55 },
  me: { fontFamily: fonts.displayItalic, color: tokens.color.coral },
});
