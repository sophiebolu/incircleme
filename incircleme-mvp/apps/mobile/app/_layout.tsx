import { useEffect, useSyncExternalStore } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { getActiveLocale, subscribeLocale } from '@incircleme/i18n';
import { applyDeviceLocale } from '../lib/deviceLocale';
import { applyDevLocale } from '../lib/devLocale';
import { applyStoredLocale } from '../lib/userLocale';
import { DevLocaleSwitcher } from '../components/DevLocaleSwitcher';
import { UniversalNav } from '../components/UniversalNav';
import { fontMap } from '../theme/fonts';
import { tokens } from '../theme/tokens';

// Resolve the real device language (ca/es/en, fallback ca) before first paint…
applyDeviceLocale();
// …then the DEV-only ?lang= / EXPO_PUBLIC_DEV_LOCALE override, which wins in dev. No-op in prod.
applyDevLocale();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap);
  // Dev locale change → re-render root (updates the switcher) + remount the
  // navigator via `key` so native screens re-read t(). Web reloads instead.
  const locale = useSyncExternalStore(subscribeLocale, getActiveLocale, getActiveLocale);

  // Re-apply a saved manual language choice (async storage read) — overrides device default.
  useEffect(() => {
    void applyStoredLocale();
  }, []);

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
      {/* Universal floating nav — over every screen (tab roots + pushed details). */}
      <UniversalNav />
      <DevLocaleSwitcher />
    </>
  );
}
