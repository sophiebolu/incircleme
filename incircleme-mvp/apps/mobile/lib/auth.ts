import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AuthTokens } from '@incircleme/types';

// SecureStore on device; localStorage when rendering on web (dev verification only).
const ACCESS_KEY = 'incircleme.access';
const REFRESH_KEY = 'incircleme.refresh';

async function setItem(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (value === null) globalThis.localStorage?.removeItem(key);
    else globalThis.localStorage?.setItem(key, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

export async function saveSession(tokens: AuthTokens): Promise<void> {
  await setItem(ACCESS_KEY, tokens.accessToken);
  await setItem(REFRESH_KEY, tokens.refreshToken);
}

export async function clearSession(): Promise<void> {
  await setItem(ACCESS_KEY, null);
  await setItem(REFRESH_KEY, null);
}

export function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_KEY);
}

export function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_KEY);
}

export async function isSignedIn(): Promise<boolean> {
  return (await getAccessToken()) !== null;
}
