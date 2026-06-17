import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Home, MessageCircle, User, type LucideIcon } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// Floating pill nav (locked UI pref): rounded raised container with side margins,
// gold active state (goldDeep is the AA-legible gold), Samsung bottom clearance.
const ICONS: Record<string, LucideIcon> = {
  index: Home,
  chats: MessageCircle,
  bookings: Calendar,
  profile: User,
};

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.band,
        {
          // Prototype index.html:1588 — clear the Samsung gesture bar / safe area.
          paddingBottom: Math.max(12, insets.bottom) + 10,
          paddingLeft: Math.max(12, insets.left),
          paddingRight: Math.max(12, insets.right),
        },
      ]}
    >
      <View style={styles.pill}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const { options } = descriptors[route.key]!;
          const label = options.title ?? route.name;
          const Icon = ICONS[route.name] ?? Home;
          const color = focused ? tokens.color.goldDeep : tokens.color.gray;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.item}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
            >
              <Icon size={22} color={color} strokeWidth={focused ? 2.2 : 1.7} />
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
              {/* Active dot indicator (prototype .bnitem.active::after); reserved space keeps heights equal. */}
              <View style={[styles.dot, focused && styles.dotOn]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    // Raised, floating (prototype .bottomnav box-shadow).
    shadowColor: '#1C1C1E',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4, borderRadius: 14 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 10.5 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent', marginTop: 1 },
  dotOn: { backgroundColor: tokens.color.goldDeep },
});
