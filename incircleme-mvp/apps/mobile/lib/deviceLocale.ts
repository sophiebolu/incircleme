import { getLocales } from 'expo-localization';
import { defaultLocale, matchLocale, setActiveLocale } from '@incircleme/i18n';

// Real device-locale resolution (the production path). On startup, read the phone's
// preferred languages and activate the first that maps to a supported app locale
// (ca/es/en). When nothing matches, CA stays the default — "language as welcome".
// Runs in every build; in dev the __DEV__ review override (applyDevLocale) runs
// afterwards and wins.
export function applyDeviceLocale(): void {
  try {
    for (const loc of getLocales()) {
      const matched = matchLocale(loc.languageCode ?? loc.languageTag);
      if (matched) {
        setActiveLocale(matched);
        return;
      }
    }
  } catch {
    // Native locale unavailable → fall through to the default.
  }
  setActiveLocale(defaultLocale); // explicit ultimate fallback (ca)
}
