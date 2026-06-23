import { db, reviews, bookings, events } from '@incircleme/db';
import type { ReviewRow } from '@incircleme/db';
import { and, eq } from 'drizzle-orm';
import { REVIEWS, isVibeTag } from '@incircleme/config';
import type { CreateReviewRequest, Review, ReviewAggregate } from '@incircleme/types';

export class BookingNotOwnedError extends Error {}
export class NotAttendedError extends Error {}
export class AlreadyReviewedError extends Error {}

function toReview(r: ReviewRow): Review {
  return {
    id: r.id,
    bookingId: r.bookingId,
    eventId: r.eventId,
    hostId: r.hostId,
    reviewerId: r.reviewerId,
    rating: r.rating,
    wouldGoAgain: r.wouldGoAgain,
    vibeTags: r.vibeTags,
    comment: r.comment,
    isPublic: r.isPublic,
    createdAt: r.createdAt.toISOString(),
  };
}

// Postgres unique-violation = SQLSTATE 23505. drizzle-orm 0.45 wraps driver
// errors (DrizzleQueryError) and exposes the original pg error on `.cause`, so
// check both the error itself and its cause.
const isUniqueViolation = (err: unknown): boolean => {
  const has23505 = (e: unknown): boolean =>
    typeof e === 'object' && e !== null && (e as { code?: string }).code === '23505';
  return has23505(err) || has23505((err as { cause?: unknown })?.cause);
};

/**
 * Create a review for one of the reviewer's own *confirmed* bookings. Private to
 * the host (`isPublic` defaults false). One review per (booking, reviewer) — the
 * unique constraint maps to AlreadyReviewedError.
 */
export async function createReview(
  reviewerId: string,
  input: CreateReviewRequest,
): Promise<Review> {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, input.bookingId))
    .limit(1);
  if (!booking || booking.userId !== reviewerId) throw new BookingNotOwnedError();
  if (booking.status !== 'confirmed') throw new NotAttendedError();

  const [event] = await db.select().from(events).where(eq(events.id, booking.eventId)).limit(1);
  if (!event) throw new NotAttendedError();

  const vibeTags = (input.vibeTags ?? []).filter(isVibeTag);
  const rating = Math.max(
    REVIEWS.ratingMin,
    Math.min(REVIEWS.ratingMax, Math.round(input.rating)),
  );

  try {
    const [row] = await db
      .insert(reviews)
      .values({
        bookingId: input.bookingId,
        reviewerId,
        eventId: booking.eventId,
        hostId: event.hostUserId,
        rating,
        wouldGoAgain: input.wouldGoAgain ?? null,
        vibeTags,
        comment: input.comment?.trim() || null,
        isPublic: input.isPublic ?? false,
      })
      .returning();
    return toReview(row!);
  } catch (err) {
    if (isUniqueViolation(err)) throw new AlreadyReviewedError();
    throw err;
  }
}

function aggregate(
  rows: { rating: number; wouldGoAgain: boolean | null; vibeTags: string[] }[],
): ReviewAggregate {
  const total = rows.length;
  if (total === 0) {
    return { count: 0, avgRating: 0, wouldGoAgainCount: 0, feltIncludedCount: 0, tagCounts: {} };
  }
  const tagCounts: Record<string, number> = {};
  let sum = 0;
  let wouldGoAgainCount = 0;
  let feltIncludedCount = 0;
  for (const r of rows) {
    sum += r.rating;
    if (r.wouldGoAgain === true) wouldGoAgainCount += 1; // explicit, not derived
    for (const tag of r.vibeTags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      if (tag === 'felt_included') feltIncludedCount += 1;
    }
  }
  return {
    count: total,
    avgRating: Math.round((sum / total) * 10) / 10,
    wouldGoAgainCount,
    feltIncludedCount,
    tagCounts,
  };
}

/** Event-page aggregate — PUBLIC reviews only (host-only reviews never leak here). */
export async function getEventPublicAggregate(eventId: string): Promise<ReviewAggregate> {
  const rows = await db
    .select({ rating: reviews.rating, wouldGoAgain: reviews.wouldGoAgain, vibeTags: reviews.vibeTags })
    .from(reviews)
    .where(and(eq(reviews.eventId, eventId), eq(reviews.isPublic, true)));
  return aggregate(rows);
}

/** Host/Passport aggregate — ALL reviews about a host (private + public). */
export async function getHostAggregate(hostId: string): Promise<ReviewAggregate> {
  const rows = await db
    .select({ rating: reviews.rating, wouldGoAgain: reviews.wouldGoAgain, vibeTags: reviews.vibeTags })
    .from(reviews)
    .where(eq(reviews.hostId, hostId));
  return aggregate(rows);
}

/** A reviewer's own given/received counts (for the Passport). */
export async function getMyReviewCounts(
  userId: string,
): Promise<{ given: number; received: number }> {
  const given = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.reviewerId, userId));
  const received = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.hostId, userId));
  return { given: given.length, received: received.length };
}
