// Dev-only: mint a signed-in session for the web walk + set host tier/credits.
// Usage: tsx scripts/devSession.ts <email> <basic|pro|premium> <freeCredits>
// Prints { accessToken, refreshToken, userId } as JSON for localStorage injection.
import { db, users } from '@incircleme/db';
import { eq } from 'drizzle-orm';
import { findOrCreateByEmail } from '../src/services/auth/users';
import { createSession } from '../src/services/auth/session';

const [, , email, tier = 'premium', credits = '0'] = process.argv;
if (!email) {
  console.error('usage: devSession.ts <email> <tier> <credits>');
  process.exit(1);
}

const user = await findOrCreateByEmail(email);
await db
  .update(users)
  .set({ hostTier: tier, freeProgramCredits: Number(credits) })
  .where(eq(users.id, user.id));
const tokens = await createSession(user.id, { userAgent: 'dev-walk', ip: '127.0.0.1' });
console.log(
  JSON.stringify({ userId: user.id, tier, credits: Number(credits), ...tokens }),
);
process.exit(0);
