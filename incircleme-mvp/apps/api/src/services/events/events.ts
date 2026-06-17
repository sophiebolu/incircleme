import { db, events, users } from '@incircleme/db';
import type { EventRow, UserRow } from '@incircleme/db';
import { and, count, eq, gte, isNull, lte } from 'drizzle-orm';
import { seatHoldAmountCents } from '@incircleme/config';
import type {
  CreateEventRequest,
  EventCategory,
  EventDetail,
  EventListItem,
  EventsQuery,
  HostSummary,
  HostTier,
  TrustTier,
} from '@incircleme/types';

export function toEventListItem(e: EventRow): EventListItem {
  const seatsLeft = Math.max(0, e.seatCount - e.seatsBooked - e.seatsHeld);
  return {
    id: e.id,
    title: e.title,
    category: e.category as EventCategory,
    neighbourhood: e.neighbourhood,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    seatCount: e.seatCount,
    seatsBooked: e.seatsBooked,
    seatsHeld: e.seatsHeld,
    seatsLeft,
    roomFull: seatsLeft <= 0,
    priceCents: e.priceCents,
    currency: e.currency,
    photoUrls: e.photoUrls,
  };
}

function toHostSummary(u: UserRow, eventsHosted: number): HostSummary {
  return {
    id: u.id,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    neighbourhood: u.neighbourhood,
    trustTier: u.trustTier as TrustTier,
    verified: u.verified,
    hostTier: u.hostTier as HostTier,
    eventsHosted,
  };
}

export async function listEvents(q: EventsQuery): Promise<EventListItem[]> {
  const conds = [isNull(events.deletedAt)];
  if (q.category) conds.push(eq(events.category, q.category));
  if (q.neighbourhood) conds.push(eq(events.neighbourhood, q.neighbourhood));
  if (q.dateFrom) conds.push(gte(events.startsAt, new Date(q.dateFrom)));
  if (q.dateTo) conds.push(lte(events.startsAt, new Date(q.dateTo)));
  const rows = await db
    .select()
    .from(events)
    .where(and(...conds))
    .orderBy(events.startsAt);
  return rows.map(toEventListItem);
}

export async function getEventDetail(id: string): Promise<EventDetail | null> {
  const [row] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), isNull(events.deletedAt)))
    .limit(1);
  if (!row) return null;
  const [host] = await db.select().from(users).where(eq(users.id, row.hostUserId)).limit(1);
  const [hostedRow] = await db
    .select({ n: count() })
    .from(events)
    .where(and(eq(events.hostUserId, row.hostUserId), isNull(events.deletedAt)));
  const eventsHosted = Number(hostedRow?.n ?? 0);
  return {
    ...toEventListItem(row),
    description: row.description,
    address: row.addressLocked ? null : row.address, // never expose until unlocked
    addressLocked: row.addressLocked,
    durationMinutes: row.durationMinutes,
    arrivingEnabled: row.arrivingEnabled,
    depositRequired: row.depositRequired,
    depositAmountCents: row.depositRequired ? seatHoldAmountCents() : 0,
    host: host
      ? toHostSummary(host, eventsHosted)
      : {
          id: row.hostUserId,
          displayName: null,
          avatarUrl: null,
          bio: null,
          neighbourhood: null,
          trustTier: 'newcomer',
          verified: false,
          hostTier: 'basic',
          eventsHosted,
        },
  };
}

export async function createEvent(
  hostUserId: string,
  input: CreateEventRequest,
): Promise<EventDetail> {
  const [row] = await db
    .insert(events)
    .values({
      hostUserId,
      title: input.title,
      description: input.description ?? null,
      language: input.language ?? 'ca',
      category: input.category,
      neighbourhood: input.neighbourhood ?? null,
      address: input.address ?? null,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      seatCount: input.seatCount,
      priceCents: input.priceCents,
      photoUrls: input.photoUrls ?? [],
    })
    .returning();
  const detail = await getEventDetail(row!.id);
  return detail!;
}
