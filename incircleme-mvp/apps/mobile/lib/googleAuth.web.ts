// Web build: native Google sign-in isn't available. The installable app is the
// supported surface for staging sign-in.
export async function signInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: 'google_app_only' };
}
