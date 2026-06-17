import { Tabs } from 'expo-router';
import { t } from '@incircleme/i18n';

// 4 tab roots. The bar itself is the app-wide UniversalNav (rendered in the root
// layout over every screen), so the Tabs navigator hides its own built-in bar.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => null}>
      <Tabs.Screen name="index" options={{ title: t('home') }} />
      <Tabs.Screen name="chats" options={{ title: t('chats') }} />
      <Tabs.Screen name="bookings" options={{ title: t('bookings') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile') }} />
    </Tabs>
  );
}
