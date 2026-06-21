import { db, users, oauthAccounts } from '@incircleme/db';
import type { UserRow } from '@incircleme/db';
import type {
  HostTier,
  Locale,
  OAuthProvider,
  TrustTier,
  UpdateMeRequest,
  User,
  UserRole,
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
    intents: row.intents,
    interests: row.interests,
    notificationPrefs: row.notificationPrefs,
    onboardingCompleted: row.onboardingCompleted,
    language: row.language as Locale,
    verified: row.verified,
    trustTier: row.trustTier as TrustTier,
    trustScore: row.trustScore,
    hostTier: row.hostTier as HostTier,
    freeProgramCredits: row.freeProgramCredits,
    role: row.role as UserRole,
    joinedAt: row.joinedAt.toISOString(),
    lastSeenAt: row.lastSeenAt ? row.lastSeenAt.toISOString() : null,
    deactivatedAt: row.deactivatedAt ? row.deactivatedAt.toISOString() : null,
  };
}

export async function getUserById(id: string): Promise<UserRow | undefined> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row;
}

export async function findOrCreateByEmail(email: string): Promise<UserRow> {
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    // Signing back in reactivates a deactivated account (the reversible-deactivation promise).
    if (existing.deactivatedAt) {
      const [reactivated] = await db
        .update(users)
        .set({ deactivatedAt: null })
        .where(eq(users.id, existing.id))
        .returning();
      return reactivated!;
    }
    return existing;
  }
  const [created] = await db.insert(users).values({ email, verified: true }).returning();
  return created!;
}

/** Reversible self-deactivation. Data is fully retained — this is NOT a GDPR erasure. */
export async function deactivateUser(id: string): Promise<UserRow> {
  const [row] = await db
    .update(users)
    .set({ deactivatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return row!;
}

export async function reactivateUser(id: string): Promise<UserRow> {
  const [row] = await db
    .update(users)
    .set({ deactivatedAt: null })
    .where(eq(users.id, id))
    .returning();
  return row!;
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
  if (patch.neighbourhood !== undefined) set.neighbourhood = patch.neighbourhood;
  if (patch.intents !== undefined) set.intents = patch.intents;
  if (patch.interests !== undefined) set.interests = patch.interests;
  if (patch.onboardingCompleted !== undefined) set.onboardingCompleted = patch.onboardingCompleted;
  if (patch.notificationPrefs !== undefined) {
    // Merge the partial toggle onto current prefs; `bookings` is always-on (locked true).
    const current = await getUserById(id);
    set.notificationPrefs = {
      bookings: true,
      circles: patch.notificationPrefs.circles ?? current?.notificationPrefs.circles ?? true,
      nearby: patch.notificationPrefs.nearby ?? current?.notificationPrefs.nearby ?? true,
    };
  }
  const [row] = await db.update(users).set(set).where(eq(users.id, id)).returning();
  return row!;
}
