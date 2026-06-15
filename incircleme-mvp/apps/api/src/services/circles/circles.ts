import {
  db,
  circles,
  circleMembers,
  circleMessages,
  circleKeepVotes,
  capsules,
  events,
  users,
} from '@incircleme/db';
import type { CircleRow, CircleMessageRow } from '@incircleme/db';
import { and, asc, count, desc, eq, isNull, lt } from 'drizzle-orm';
import type {
  CircleDetail,
  CircleMember,
  CircleMessage,
  CircleSummary,
  MessageAttachment,
} from '@incircleme/types';
import { toEventListItem } from '../events/events';

const KEEP_THRESHOLD = 4; // §11: "Quatre persones del Cercle volen una propera trobada."
const H48 = 48 * 60 * 60 * 1000;

export class NotMemberError extends Error {
  constructor() {
    super('not_member');
  }
}

function toMessage(row: CircleMessageRow): CircleMessage {
  return {
    id: row.id,
    circleId: row.circleId,
    userId: row.userId,
    body: row.body,
    language: row.language as CircleMessage['language'],
    attachments: (row.attachments as MessageAttachment[] | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Auto-creates the event's Circle on first confirmed booking; adds host + attendee. */
export async function ensureCircleAndMembership(
  eventId: string,
  attendeeUserId: string,
): Promise<CircleRow> {
  return db.transaction(async (tx) => {
    const [event] = await tx.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event) throw new Error('event_not_found');

    let [circle] = await tx.select().from(circles).where(eq(circles.eventId, eventId)).limit(1);
    if (!circle) {
      [circle] = await tx
        .insert(circles)
        .values({
          eventId,
          opensAt: new Date(event.startsAt.getTime() - H48),
          closesAt: new Date(event.endsAt.getTime() + H48),
        })
        .onConflictDoNothing()
        .returning();
      if (!circle) {
        [circle] = await tx.select().from(circles).where(eq(circles.eventId, eventId)).limit(1);
      }
    }

    const memberRows = [
      { circleId: circle!.id, userId: event.hostUserId, role: 'host' },
      { circleId: circle!.id, userId: attendeeUserId, role: 'attendee' },
    ];
    await tx.insert(circleMembers).values(memberRows).onConflictDoNothing();

    const counted = await tx
      .select({ value: count() })
      .from(circleMembers)
      .where(and(eq(circleMembers.circleId, circle!.id), isNull(circleMembers.leftAt)));
    const members = counted[0]?.value ?? 0;
    await tx.update(circles).set({ memberCount: members }).where(eq(circles.id, circle!.id));

    return { ...circle!, memberCount: members };
  });
}

export async function requireMembership(circleId: string, userId: string): Promise<void> {
  const [m] = await db
    .select()
    .from(circleMembers)
    .where(
      and(
        eq(circleMembers.circleId, circleId),
        eq(circleMembers.userId, userId),
        isNull(circleMembers.leftAt),
      ),
    )
    .limit(1);
  if (!m) throw new NotMemberError();
}

export async function listMyCircles(userId: string): Promise<CircleSummary[]> {
  const rows = await db
    .select({ circle: circles, eventTitle: events.title, capsuleId: capsules.id })
    .from(circleMembers)
    .innerJoin(circles, eq(circleMembers.circleId, circles.id))
    .innerJoin(events, eq(circles.eventId, events.id))
    .leftJoin(capsules, eq(capsules.circleId, circles.id))
    .where(and(eq(circleMembers.userId, userId), isNull(circleMembers.leftAt)))
    .orderBy(desc(circles.createdAt));
  const summaries: CircleSummary[] = [];
  for (const { circle, eventTitle, capsuleId } of rows) {
    const [last] = await db
      .select({ createdAt: circleMessages.createdAt })
      .from(circleMessages)
      .where(and(eq(circleMessages.circleId, circle.id), isNull(circleMessages.deletedAt)))
      .orderBy(desc(circleMessages.createdAt))
      .limit(1);
    summaries.push({
      id: circle.id,
      eventId: circle.eventId,
      eventTitle,
      opensAt: circle.opensAt.toISOString(),
      closesAt: circle.closesAt.toISOString(),
      keptAt: circle.keptAt ? circle.keptAt.toISOString() : null,
      memberCount: circle.memberCount,
      lastMessageAt: last ? last.createdAt.toISOString() : null,
      hasCapsule: capsuleId !== null,
    });
  }
  return summaries;
}

export async function getCircleDetail(circleId: string, userId: string): Promise<CircleDetail | null> {
  await requireMembership(circleId, userId);
  const [circle] = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1);
  if (!circle) return null;
  const [event] = await db.select().from(events).where(eq(events.id, circle.eventId)).limit(1);
  if (!event) return null;

  const memberRows = await db
    .select({
      userId: circleMembers.userId,
      role: circleMembers.role,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(circleMembers)
    .innerJoin(users, eq(circleMembers.userId, users.id))
    .where(and(eq(circleMembers.circleId, circleId), isNull(circleMembers.leftAt)));

  const recent = await db
    .select()
    .from(circleMessages)
    .where(and(eq(circleMessages.circleId, circleId), isNull(circleMessages.deletedAt)))
    .orderBy(desc(circleMessages.createdAt))
    .limit(30);

  const votes = await db
    .select()
    .from(circleKeepVotes)
    .where(eq(circleKeepVotes.circleId, circleId));
  const mine = votes.find((v) => v.userId === userId);

  return {
    id: circle.id,
    event: {
      ...toEventListItem(event),
      address: event.addressLocked ? null : event.address,
      addressLocked: event.addressLocked,
    },
    opensAt: circle.opensAt.toISOString(),
    closesAt: circle.closesAt.toISOString(),
    keptAt: circle.keptAt ? circle.keptAt.toISOString() : null,
    members: memberRows.map(
      (m): CircleMember => ({
        userId: m.userId,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl,
        role: m.role as CircleMember['role'],
      }),
    ),
    recentMessages: recent.reverse().map(toMessage),
    myKeepVote: mine ? mine.vote : null,
    keepYesCount: votes.filter((v) => v.vote).length,
  };
}

export async function listMessages(
  circleId: string,
  userId: string,
  opts: { before?: string; limit?: number } = {},
): Promise<CircleMessage[]> {
  await requireMembership(circleId, userId);
  const limit = Math.min(opts.limit ?? 50, 100);
  const conds = [eq(circleMessages.circleId, circleId), isNull(circleMessages.deletedAt)];
  if (opts.before) conds.push(lt(circleMessages.id, opts.before)); // UUIDv7 ids sort by time
  const rows = await db
    .select()
    .from(circleMessages)
    .where(and(...conds))
    .orderBy(asc(circleMessages.id))
    .limit(limit);
  return rows.map(toMessage);
}

export async function postMessage(
  circleId: string,
  userId: string,
  body: string,
  attachments?: MessageAttachment[],
): Promise<CircleMessage> {
  await requireMembership(circleId, userId);
  const [row] = await db
    .insert(circleMessages)
    .values({ circleId, userId, body, attachments: attachments ?? null })
    .returning();
  return toMessage(row!);
}

/** Casts/updates a keep vote; flips kept_at once yes-votes reach the threshold. */
export async function castKeepVote(
  circleId: string,
  userId: string,
  vote: boolean,
): Promise<{ keepYesCount: number; kept: boolean }> {
  await requireMembership(circleId, userId);
  await db
    .insert(circleKeepVotes)
    .values({ circleId, userId, vote })
    .onConflictDoUpdate({
      target: [circleKeepVotes.circleId, circleKeepVotes.userId],
      set: { vote, votedAt: new Date() },
    });
  const votes = await db
    .select()
    .from(circleKeepVotes)
    .where(eq(circleKeepVotes.circleId, circleId));
  const yes = votes.filter((v) => v.vote).length;
  let kept = false;
  if (yes >= KEEP_THRESHOLD) {
    await db
      .update(circles)
      .set({ keptAt: new Date() })
      .where(and(eq(circles.id, circleId), isNull(circles.keptAt)));
    kept = true;
  }
  return { keepYesCount: yes, kept };
}
