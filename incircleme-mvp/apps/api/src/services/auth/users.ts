import { db, users, oauthAccounts } from '@incircleme/db';
import type { UserRow } from '@incircleme/db';
import type {
  Locale,
  OAuthProvider,
  TrustTier,
  UpdateMeRequest,
  User,
} from '@incircleme/types';
import { and, eq } from 'drizzle-orm';

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    handle: row.handle,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    neighbourhood: row.neighbourhood,
    language: row.language as Locale,
    verified: row.verified,
    trustTier: row.trustTier as TrustTier,
    trustScore: row.trustScore,
    joinedAt: row.joinedAt.toISOString(),
    lastSeenAt: row.lastSeenAt ? row.lastSeenAt.toISOString() : null,
  };
}

export async function getUserById(id: string): Promise<UserRow | undefined> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row;
}

export async function findOrCreateByEmail(email: string): Promise<UserRow> {
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(users).values({ email, verified: true }).returning();
  return created!;
}

export async function findOrCreateByOAuth(
  provider: OAuthProvider,
  providerUserId: string,
  email: string,
): Promise<UserRow> {
  const [link] = await db
    .select()
    .from(oauthAccounts)
    .where(
      and(eq(oauthAccounts.provider, provider), eq(oauthAccounts.providerUserId, providerUserId)),
    )
    .limit(1);
  if (link) {
    const user = await getUserById(link.userId);
    if (user) return user;
  }
  const user = await findOrCreateByEmail(email);
  await db
    .insert(oauthAccounts)
    .values({ provider, providerUserId, userId: user.id })
    .onConflictDoNothing();
  return user;
}

export async function updateUser(id: string, patch: UpdateMeRequest): Promise<UserRow> {
  const set: Partial<UserRow> = {};
  if (patch.displayName !== undefined) set.displayName = patch.displayName;
  if (patch.bio !== undefined) set.bio = patch.bio;
  if (patch.avatarUrl !== undefined) set.avatarUrl = patch.avatarUrl;
  if (patch.language !== undefined) set.language = patch.language;
  const [row] = await db.update(users).set(set).where(eq(users.id, id)).returning();
  return row!;
}
