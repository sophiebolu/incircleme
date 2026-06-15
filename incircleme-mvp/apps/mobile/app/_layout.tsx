import { useSyncExternalStore } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { getActiveLocale, subscribeLocale } from '@incircleme/i18n';
import { applyDevLocale } from '../lib/devLocale';
import { DevLocaleSwitcher } from '../components/DevLocaleSwitcher';
import { fontMap } from '../theme/fonts';
import { tokens } from '../theme/tokens';

// DEV-only: pick up ?lang= / EXPO_PUBLIC_DEV_LOCALE before first paint. No-op in prod.
applyDevLocale();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap);
  // Dev locale change → re-render root (updates the switcher) + remount the
  // navigator via `key` so native screens re-read t(). Web reloads instead.
  const locale = useSyncExternalStore(subscribeLocale, getActiveLocale, getActiveLocale);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: tokens.color.cream }} />;
  }
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        key={locale}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: tokens.color.cream },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      <DevLocaleSwitcher />
    </>
  );
}
