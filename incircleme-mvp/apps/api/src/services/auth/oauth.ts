import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { OAuthProvider } from '@incircleme/types';
import { env } from '../../env';

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
const LINKEDIN_JWKS = createRemoteJWKSet(new URL('https://www.linkedin.com/oauth/openid/jwks'));

export interface OAuthIdentity {
  providerUserId: string;
  email: string;
}

/** Thrown when a provider's client ID isn't configured yet (credentials pending). */
export class ProviderNotConfiguredError extends Error {
  constructor(public provider: OAuthProvider) {
    super(`${provider} oauth not configured`);
  }
}

/** The client ID each provider verifies against (its token `audience`). */
function clientIdFor(provider: OAuthProvider): string | undefined {
  if (provider === 'google') return env.GOOGLE_CLIENT_ID;
  if (provider === 'apple') return env.APPLE_CLIENT_ID;
  return env.LINKEDIN_CLIENT_ID;
}

/** Providers wired with credentials right now — drives graceful button gating. */
export function enabledProviders(): OAuthProvider[] {
  return (['google', 'apple', 'linkedin'] as OAuthProvider[]).filter((p) => !!clientIdFor(p));
}

/**
 * Verifies a provider id_token server-side via JWKS and returns the linked
 * identity. Throws ProviderNotConfiguredError if credentials are absent (so the
 * route can answer cleanly instead of faking a login), or a verification error
 * if the token is invalid. find-or-create links by email, so we only trust an
 * email the provider marks verified.
 */
export async function verifyOAuthIdToken(
  provider: OAuthProvider,
  idToken: string,
): Promise<OAuthIdentity> {
  const clientId = clientIdFor(provider);
  if (!clientId) throw new ProviderNotConfiguredError(provider);

  if (provider === 'google') {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    });
    if (payload.email_verified !== true) throw new Error('email_not_verified');
    return { providerUserId: payload.sub!, email: String(payload.email ?? '') };
  }

  if (provider === 'apple') {
    const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: clientId,
    });
    // Apple sends email_verified as the string "true" (or boolean) on first consent.
    if (payload.email_verified !== true && payload.email_verified !== 'true') {
      throw new Error('email_not_verified');
    }
    return { providerUserId: payload.sub!, email: String(payload.email ?? '') };
  }

  // LinkedIn — OpenID Connect (issuer https://www.linkedin.com/oauth).
  const { payload } = await jwtVerify(idToken, LINKEDIN_JWKS, {
    issuer: 'https://www.linkedin.com/oauth',
    audience: clientId,
  });
  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    throw new Error('email_not_verified');
  }
  return { providerUserId: payload.sub!, email: String(payload.email ?? '') };
}
