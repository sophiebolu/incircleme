// Manual language choice — persists locally and OVERRIDES the device default.
// On startup applyStoredLocale() runs after applyDeviceLocale (see app/_layout),
// so a saved choice wins over the phone's language. The choice is also written to
// the profile via PATCH /me (api.updateMe) so it follows the account across devices.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { matchLocale, setActiveLocale } from '@incircleme/i18n';
import type { Locale } from '@incircleme/types';

const LOCALE_KEY = 'incircleme.locale';

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

/** Switch the active locale live and persist the manual choice on the device. */
export async function setUserLocale(locale: Locale): Promise<void> {
  setActiveLocale(locale);
  await setItem(LOCALE_KEY, locale);
}

/** On startup: re-apply a previously saved manual choice (overrides device default). */
export async function applyStoredLocale(): Promise<void> {
  const matched = matchLocale(await getItem(LOCALE_KEY));
  if (matched) setActiveLocale(matched);
}
