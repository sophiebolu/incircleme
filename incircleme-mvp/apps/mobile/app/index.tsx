import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export default function Home() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>IncircleMe</Text>
      <Text style={styles.subtitle}>Petites sales · Barcelona</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.color.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: tokens.font.display,
    fontSize: 34,
    color: tokens.color.forest,
  },
  subtitle: {
    fontFamily: tokens.font.body,
    fontSize: 15,
    color: tokens.color.coral,
    marginTop: 8,
  },
});
