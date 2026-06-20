// Native Google sign-in (Metro picks googleAuth.web.ts on web — the native module
// isn't available there). Returns an id_token whose audience is the Web client ID,
// which the API verifies at POST /auth/oauth/google.
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { api } from './api';
import { saveSession } from './auth';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
let configured = false;

export async function signInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!WEB_CLIENT_ID) return { ok: false, error: 'google_not_configured' };
    if (!configured) {
      GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
      configured = true;
    }
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Response shape differs across library versions ({ data: { idToken } } in v13+);
    // read it defensively so a version bump can't break the build.
    const resp = (await GoogleSignin.signIn()) as unknown as {
      data?: { idToken?: string | null };
      idToken?: string | null;
    };
    const idToken = resp?.data?.idToken ?? resp?.idToken ?? null;
    if (!idToken) return { ok: false, error: 'cancelled' };
    const session = await api.oauthGoogle(idToken);
    await saveSession(session);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}
