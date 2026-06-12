import { db, arrivingMoments, circles, events } from '@incircleme/db';
import type { ArrivingMomentRow } from '@incircleme/db';
import { and, eq, isNull } from 'drizzle-orm';
import type { ArrivingMoment, ArrivingState } from '@incircleme/types';
import type { PhotoStorage } from '../../lib/storage';
import { requireMembership } from '../circles/circles';

const H48 = 48 * 60 * 60 * 1000;

export class NotOwnerError extends Error {
  constructor() {
    super('not_owner');
  }
}

function toMoment(row: ArrivingMomentRow): ArrivingMoment {
  return {
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    state: row.state as ArrivingState,
    photoUrl: row.photoUrl,
    chatExpiresAt: row.chatExpiresAt.toISOString(),
    takenAt: row.takenAt.toISOString(),
  };
}

async function circleForEvent(eventId: string) {
  const [circle] = await db.select().from(circles).where(eq(circles.eventId, eventId)).limit(1);
  if (!circle) throw new Error('circle_not_found');
  return circle;
}

/** Upserts the user's before/after moment (unique per event+user+state). */
export async function createMoment(
  eventId: string,
  userId: string,
  state: ArrivingState,
  photo: Buffer,
  ext: string,
  storage: PhotoStorage,
): Promise<ArrivingMoment> {
  const circle = await circleForEvent(eventId);
  await requireMembership(circle.id, userId);
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  const photoUrl = await storage.save(photo, ext);
  const chatExpiresAt = new Date(event!.endsAt.getTime() + H48);
  const [row] = await db
    .insert(arrivingMoments)
    .values({ eventId, userId, state, photoUrl, chatExpiresAt })
    .onConflictDoUpdate({
      target: [arrivingMoments.eventId, arrivingMoments.userId, arrivingMoments.state],
      set: { photoUrl, takenAt: new Date(), deletedAt: null },
    })
    .returning();
  return toMoment(row!);
}

/** All non-deleted moments for the event — Circle-scoped (members only). */
export async function listMoments(eventId: string, userId: string): Promise<ArrivingMoment[]> {
  const circle = await circleForEvent(eventId);
  await requireMembership(circle.id, userId);
  const rows = await db
    .select()
    .from(arrivingMoments)
    .where(and(eq(arrivingMoments.eventId, eventId), isNull(arrivingMoments.deletedAt)));
  return rows.map(toMoment);
}

/** Owner-only soft delete. */
export async function deleteMoment(momentId: string, userId: string): Promise<void> {
  const [row] = await db
    .select()
    .from(arrivingMoments)
    .where(eq(arrivingMoments.id, momentId))
    .limit(1);
  if (!row || row.deletedAt) return;
  if (row.userId !== userId) throw new NotOwnerError();
  await db
    .update(arrivingMoments)
    .set({ deletedAt: new Date() })
    .where(eq(arrivingMoments.id, momentId));
}
