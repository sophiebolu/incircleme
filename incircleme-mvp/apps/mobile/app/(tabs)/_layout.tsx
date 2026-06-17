import { Tabs } from 'expo-router';
import { t } from '@incircleme/i18n';
import { BottomNav } from '../../components/BottomNav';

// 4-tab nav (Home · Chats · Bookings · Profile; no center FAB). Rendering is the
// custom floating-pill BottomNav (gold active state, Samsung bottom clearance).
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomNav {...props} />}>
      <Tabs.Screen name="index" options={{ title: t('home') }} />
      <Tabs.Screen name="chats" options={{ title: t('chats') }} />
      <Tabs.Screen name="bookings" options={{ title: t('bookings') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile') }} />
    </Tabs>
  );
}
