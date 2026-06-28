import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { interpolate, t } from '@incircleme/i18n';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// Prototype .brandbar (present on ~all screens): Fraunces wordmark left, italic-coral "Me"
// accent; gold bell on Home → opens the notifications inbox, with an unread badge.
export function BrandBar({
  bell = false,
  unread = 0,
  onBell,
}: {
  bell?: boolean;
  unread?: number;
  onBell?: () => void;
}) {
  return (
    <View style={styles.bar}>
      <Text style={styles.brand}>
        Incircle
        <Text style={styles.accent}>Me</Text>
      </Text>
      {bell ? (
        <Pressable
          onPress={onBell}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={interpolate(t('notif_unreadBadgeLabel'), { count: String(unread) })}
        >
          <Bell size={20} color={tokens.color.gold} strokeWidth={2} />
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText} allowFontScaling={false}>
                {unread > 9 ? '9+' : String(unread)}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 18,
  },
  brand: {
    fontFamily: fonts.displaySemi,
    fontSize: 19,
    letterSpacing: -0.34,
    color: tokens.color.ink,
  },
  accent: {
    fontFamily: fonts.displayItalic,
    color: tokens.color.coral,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3.5,
    backgroundColor: tokens.color.coralInk, // coralInk/cream = 4.73 (AA)
    borderWidth: 1.5,
    borderColor: tokens.color.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bodyHeavy, fontSize: 9.5, color: tokens.color.cream },
});
