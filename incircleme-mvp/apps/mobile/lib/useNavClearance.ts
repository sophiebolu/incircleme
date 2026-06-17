import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Total height the floating UniversalNav occupies at the bottom of the screen.
// Screens pad their scroll content (and the chat composer) by this so nothing
// sits underneath the nav. Mirrors UniversalNav: band paddingTop (8) + pill
// (~68) + band paddingBottom (10) + Samsung safe-area clearance.
export function useNavClearance(): number {
  const insets = useSafeAreaInsets();
  return 86 + Math.max(12, insets.bottom);
}
