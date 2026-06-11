import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { t } from '@incircleme/i18n';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

// 4-tab nav per the prototype (Home · Chats · Bookings · Profile; no center FAB).
const GLYPHS: Record<string, string> = { index: '⌂', chats: '◯', bookings: '▤', profile: '◉' };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: tokens.color.forest,
        tabBarInactiveTintColor: tokens.color.gray,
        tabBarStyle: {
          backgroundColor: tokens.color.cream,
          borderTopColor: tokens.color.border,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 10.5 },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 17 }}>{GLYPHS[route.name] ?? '·'}</Text>
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: t('home') }} />
      <Tabs.Screen name="chats" options={{ title: t('chats') }} />
      <Tabs.Screen name="bookings" options={{ title: t('bookings') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile') }} />
    </Tabs>
  );
}
