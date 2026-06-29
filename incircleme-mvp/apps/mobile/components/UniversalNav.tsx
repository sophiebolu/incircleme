import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { Calendar, Home, MessageCircle, User, type LucideIcon } from 'lucide-react-native';
import { t, type StringKey } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';
import { isChromelessRoute } from '../lib/onboarding';

// Universal floating-pill nav — rendered once in the root layout, over EVERY
// screen (tab roots + pushed detail screens). Route-aware: highlights the tab a
// screen belongs to, or none when ambiguous. Gold active state, Samsung clearance.
type TabKey = 'index' | 'chats' | 'bookings' | 'profile';
const TABS: { key: TabKey; path: string; label: StringKey; Icon: LucideIcon }[] = [
  { key: 'index', path: '/', label: 'home', Icon: Home },
  { key: 'chats', path: '/chats', label: 'chats', Icon: MessageCircle },
  { key: 'bookings', path: '/bookings', label: 'bookings', Icon: Calendar },
  { key: 'profile', path: '/profile', label: 'profile', Icon: User },
];

/** Map any pathname to the tab it belongs to (null = no highlight when ambiguous). */
function activeTab(pathname: string): TabKey | null {
  if (pathname === '/' || pathname === '/index') return 'index';
  if (pathname.startsWith('/chats') || pathname.startsWith('/circle') || pathname.startsWith('/capsule'))
    return 'chats';
  if (pathname.startsWith('/bookings') || pathname.startsWith('/book')) return 'bookings';
  if (pathname.startsWith('/profile')) return 'profile';
  // Browse-ish detail screens sit under Home.
  if (pathname.startsWith('/event') || pathname.startsWith('/program') || pathname.startsWith('/category'))
    return 'index';
  return null;
}

export function UniversalNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const active = activeTab(pathname);

  // Onboarding is full-screen with no app chrome: hide the floating tab nav on every
  // chromeless (onb_*) route so it neither shows the tab bar nor overlaps the Continue
  // CTA. Tabs reappear only once the user completes onboarding and lands on a (tabs) route.
  if (isChromelessRoute(pathname)) return null;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View
        pointerEvents="box-none"
        style={[
          styles.band,
          {
            paddingBottom: Math.max(12, insets.bottom) + 10,
            paddingLeft: Math.max(12, insets.left),
            paddingRight: Math.max(12, insets.right),
          },
        ]}
      >
        <View style={styles.pill}>
          {TABS.map(({ key, path, label, Icon }) => {
            const focused = active === key;
            const color = focused ? tokens.color.goldDeep : tokens.color.text2;
            return (
              <Pressable
                key={key}
                onPress={() => router.navigate(path)}
                style={styles.item}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={t(label)}
              >
                <Icon size={22} color={color} strokeWidth={focused ? 2.2 : 1.7} />
                <Text style={[styles.itemLabel, { color }]} numberOfLines={1}>
                  {t(label)}
                </Text>
                <View style={[styles.dot, focused && styles.dotOn]} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  band: { backgroundColor: tokens.color.cream, paddingTop: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#1C1C1E',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4, borderRadius: 14 },
  itemLabel: { fontFamily: fonts.bodyMedium, fontSize: 10.5 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent', marginTop: 1 },
  dotOn: { backgroundColor: tokens.color.goldDeep },
});
