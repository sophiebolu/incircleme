import type { Locale, User } from './index';

export type OAuthProvider = 'google' | 'apple';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds. */
  expiresIn: number;
}

export interface AuthResult extends AuthTokens {
  user: User;
}

/** Claims carried in the access JWT. */
export interface AccessClaims {
  sub: string; // user id
  iat: number;
  exp: number;
}

// --- Request bodies ---

export interface MagicLinkRequest {
  email: string;
  locale?: Locale;
}

export interface VerifyRequest {
  token: string;
}

export interface OAuthRequest {
  idToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface UpdateMeRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  neighbourhood?: string;
  language?: Locale;
}

export type MeResponse = User;
