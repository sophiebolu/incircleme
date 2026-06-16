import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { OAuthProvider } from '@incircleme/types';
import { env } from '../../env';

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export interface OAuthIdentity {
  providerUserId: string;
  email: string;
}

/**
 * Verifies a provider id_token server-side via JWKS. Throws if the provider's
 * client ID isn't configured yet (Phase 2) or the token is invalid.
 */
export async function verifyOAuthIdToken(
  provider: OAuthProvider,
  idToken: string,
): Promise<OAuthIdentity> {
  if (provider === 'google') {
    if (!env.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID not configured');
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: env.GOOGLE_CLIENT_ID,
    });
    // Only trust the email if Google says it's verified — findOrCreateByOAuth
    // links accounts by email, so an unverified address could hijack an account.
    if (payload.email_verified !== true) throw new Error('email_not_verified');
    return { providerUserId: payload.sub!, email: String(payload.email ?? '') };
  }
  if (!env.APPLE_CLIENT_ID) throw new Error('APPLE_CLIENT_ID not configured');
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: env.APPLE_CLIENT_ID,
  });
  return { providerUserId: payload.sub!, email: String(payload.email ?? '') };
}
