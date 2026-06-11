import { db, sessions } from '@incircleme/db';
import type { AuthTokens } from '@incircleme/types';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { env } from '../../env';
import { signAccessToken } from '../../lib/jwt';
import { generateToken, hashToken } from '../../lib/tokens';

interface SessionContext {
  userAgent?: string | null;
  ip?: string | null;
}

export async function createSession(
  userId: string,
  ctx: SessionContext = {},
): Promise<AuthTokens> {
  const refreshToken = generateToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000);
  await db.insert(sessions).values({
    userId,
    refreshTokenHash,
    expiresAt,
    userAgent: ctx.userAgent ?? null,
    ip: ctx.ip ?? null,
  });
  const accessToken = await signAccessToken(userId);
  return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_TTL_SECONDS };
}

/** Rotates: atomically revokes the presented refresh token, then issues a fresh pair. */
export async function refreshSession(
  refreshToken: string,
  ctx: SessionContext = {},
): Promise<AuthTokens | null> {
  const refreshTokenHash = hashToken(refreshToken);
  const now = new Date();
  const [row] = await db
    .update(sessions)
    .set({ revokedAt: now })
    .where(
      and(
        eq(sessions.refreshTokenHash, refreshTokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
      ),
    )
    .returning();
  if (!row) return null;
  return createSession(row.userId, ctx);
}

export async function revokeSession(refreshToken: string): Promise<void> {
  const refreshTokenHash = hashToken(refreshToken);
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.refreshTokenHash, refreshTokenHash), isNull(sessions.revokedAt)));
}
