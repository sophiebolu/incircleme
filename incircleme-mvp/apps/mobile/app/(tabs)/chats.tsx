import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

// Circles land in Slice 3.
export default function Chats() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Xats</Text>
      <Text style={styles.sub}>Els Cercles arriben aviat.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.color.cream,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: tokens.color.forest },
  sub: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.gray },
});
