import { db, magicLinkTokens } from '@incircleme/db';
import type { Locale } from '@incircleme/types';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { env } from '../../env';
import { generateToken, hashToken } from '../../lib/tokens';
import type { Mailer } from '../../lib/mailer';

export async function requestMagicLink(
  email: string,
  locale: Locale,
  mailer: Mailer,
): Promise<void> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + env.MAGIC_LINK_TTL_SECONDS * 1000);
  await db.insert(magicLinkTokens).values({ email, tokenHash, expiresAt });
  const link = `${env.MAGIC_LINK_SCHEME}://auth/verify?token=${token}`;
  await mailer.sendMagicLink({ to: email, link, locale });
}

/** Atomically consume a valid, unexpired, unused token. Returns the email or null. */
export async function verifyMagicLink(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const now = new Date();
  const [row] = await db
    .update(magicLinkTokens)
    .set({ consumedAt: now })
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        isNull(magicLinkTokens.consumedAt),
        gt(magicLinkTokens.expiresAt, now),
      ),
    )
    .returning();
  return row ? row.email : null;
}
