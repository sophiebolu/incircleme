import { Platform } from 'react-native';
import { setActiveLocale, type Locale } from '@incircleme/i18n';

// DEV-ONLY review tooling. CA stays the shipping default; this never runs in
// production (guarded by __DEV__). Web reads `?lang=`; Expo Go reads
// EXPO_PUBLIC_DEV_LOCALE. Strictly a review switch — not the real locale path.

const VALID: Locale[] = ['ca', 'es', 'en'];
export function isLocale(v: string | null | undefined): v is Locale {
  return !!v && (VALID as string[]).includes(v);
}

/** Applies the initial review locale at startup. No-op in production. */
export function applyDevLocale(): void {
  if (!__DEV__) return;
  let override: string | null | undefined;
  if (Platform.OS === 'web') {
    override = new URLSearchParams(globalThis.location?.search ?? '').get('lang');
  } else {
    override = process.env.EXPO_PUBLIC_DEV_LOCALE;
  }
  if (isLocale(override)) setActiveLocale(override);
}
