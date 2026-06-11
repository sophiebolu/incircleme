import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { fontMap } from '../theme/fonts';
import { tokens } from '../theme/tokens';

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap);
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: tokens.color.cream }} />;
  }
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: tokens.color.cream },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
