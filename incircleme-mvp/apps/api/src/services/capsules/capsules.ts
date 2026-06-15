import {
  db,
  capsules,
  capsuleItems,
  circles,
  circleMessages,
  arrivingMoments,
  events,
  users,
} from '@incircleme/db';
import type { CapsuleRow } from '@incircleme/db';
import { and, asc, count, eq, isNull } from 'drizzle-orm';
import type {
  Capsule,
  CapsulePhoto,
  CapsuleStats,
  DifferencePair,
  MessageAttachment,
} from '@incircleme/types';
import { requireMembership } from '../circles/circles';

/**
 * Generates the event's Capsule once (idempotent — unique per circle).
 * Items snapshot their payloads: the roll survives the 48h chat strip.
 * "Silent, not stigmatised": only members with BOTH arriving photos produce a
 * difference pair; everyone else simply isn't represented.
 */
export async function generateCapsule(eventId: string): Promise<CapsuleRow | null> {
  const [circle] = await db.select().from(circles).where(eq(circles.eventId, eventId)).limit(1);
  if (!circle) return null;
  const [existing] = await db
    .select()
    .from(capsules)
    .where(eq(capsules.circleId, circle.id))
    .limit(1);
  if (existing) return existing;

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return null;

  // Arriving moments → pairs (both states) for the difference view; all photos join the roll.
  const moments = await db
    .select()
    .from(arrivingMoments)
    .where(and(eq(arrivingMoments.eventId, eventId), isNull(arrivingMoments.deletedAt)))
    .orderBy(asc(arrivingMoments.takenAt));
  const byUser = new Map<string, { before?: (typeof moments)[number]; after?: (typeof moments)[number] }>();
  for (const m of moments) {
    const entry = byUser.get(m.userId) ?? {};
    entry[m.state as 'before' | 'after'] = m;
    byUser.set(m.userId, entry);
  }
  const pairs = [...byUser.entries()]
    .filter(([, v]) => v.before && v.after)
    .map(([userId, v]) => ({
      userId,
      beforeUrl: v.before!.photoUrl,
      afterUrl: v.after!.photoUrl,
      beforeAt: v.before!.takenAt.toISOString(),
      afterAt: v.after!.takenAt.toISOString(),
    }));

  // Chat photo attachments (snapshot before the 48h strip) + arriving photos → the roll.
  const msgs = await db
    .select()
    .from(circleMessages)
    .where(and(eq(circleMessages.circleId, circle.id), isNull(circleMessages.deletedAt)))
    .orderBy(asc(circleMessages.createdAt));
  const roll: CapsulePhoto[] = [];
  for (const m of msgs) {
    for (const a of (m.attachments as MessageAttachment[] | null) ?? []) {
      if (a.url) roll.push({ url: a.url, userId: m.userId });
    }
  }
  for (const m of moments) roll.push({ url: m.photoUrl, userId: m.userId });

  const [{ value: messageCount }] = (await db
    .select({ value: count() })
    .from(circleMessages)
    .where(and(eq(circleMessages.circleId, circle.id), isNull(circleMessages.deletedAt)))) as [
    { value: number },
  ];

  const stats: CapsuleStats = {
    members: circle.memberCount,
    sharedBoth: pairs.length,
    photos: roll.length,
    messages: messageCount,
    keptAt: circle.keptAt ? circle.keptAt.toISOString() : null,
  };
  const heroPhotoUrl = pairs[0]?.afterUrl ?? roll[0]?.url ?? event.photoUrls[0] ?? null;

  return db.transaction(async (tx) => {
    const [capsule] = await tx
      .insert(capsules)
      .values({ circleId: circle.id, eventId, heroPhotoUrl, stats })
      .onConflictDoNothing()
      .returning();
    if (!capsule) {
      const [raced] = await tx.select().from(capsules).where(eq(capsules.circleId, circle.id));
      return raced ?? null;
    }
    let pos = 0;
    for (const p of pairs) {
      await tx
        .insert(capsuleItems)
        .values({ capsuleId: capsule.id, kind: 'arriving_pair', payload: p, position: pos++ });
    }
    for (const photo of roll) {
      await tx
        .insert(capsuleItems)
        .values({ capsuleId: capsule.id, kind: 'photo', payload: photo, position: pos++ });
    }
    return capsule;
  });
}

/** Member-gated read; 'quote' items pass through when reviews land (Slice 6). */
export async function getCapsule(circleId: string, userId: string): Promise<Capsule | null> {
  await requireMembership(circleId, userId);
  const [capsule] = await db
    .select()
    .from(capsules)
    .where(and(eq(capsules.circleId, circleId), isNull(capsules.deletedAt)))
    .limit(1);
  if (!capsule) return null;
  const [event] = await db.select().from(events).where(eq(events.id, capsule.eventId)).limit(1);
  const items = await db
    .select()
    .from(capsuleItems)
    .where(eq(capsuleItems.capsuleId, capsule.id))
    .orderBy(asc(capsuleItems.position));

  const rawPairs = items
    .filter((i) => i.kind === 'arriving_pair')
    .map((i) => i.payload as Omit<DifferencePair, 'displayName'>);
  const names = new Map<string, string | null>();
  for (const p of rawPairs) {
    if (!names.has(p.userId)) {
      const [u] = await db
        .select({ displayName: users.displayName })
        .from(users)
        .where(eq(users.id, p.userId))
        .limit(1);
      names.set(p.userId, u?.displayName ?? null);
    }
  }

  return {
    id: capsule.id,
    circleId,
    eventId: capsule.eventId,
    eventTitle: event?.title ?? '',
    eventDate: event?.startsAt.toISOString() ?? capsule.generatedAt.toISOString(),
    neighbourhood: event?.neighbourhood ?? null,
    heroPhotoUrl: capsule.heroPhotoUrl,
    stats: capsule.stats as CapsuleStats,
    photos: items.filter((i) => i.kind === 'photo').map((i) => i.payload as CapsulePhoto),
    differencePairs: rawPairs.map((p) => ({ ...p, displayName: names.get(p.userId) ?? null })),
    quotes: items
      .filter((i) => i.kind === 'quote')
      .map((i) => i.payload as { body: string; authorName: string | null }),
    generatedAt: capsule.generatedAt.toISOString(),
  };
}
