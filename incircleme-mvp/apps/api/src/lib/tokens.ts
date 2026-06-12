import { randomBytes, createHash } from 'node:crypto';

/** High-entropy opaque token (magic-link / refresh). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Tokens are random secrets, so a fast SHA-256 hash is sufficient for at-rest storage. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
