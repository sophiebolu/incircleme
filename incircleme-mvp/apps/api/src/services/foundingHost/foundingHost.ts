import { db, bookings, circles, events, users } from '@incircleme/db';
import { and, count, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import {
  cohortKeyForNeighbourhood,
  foundingCohortLabel,
  foundingHostCap,
  foundingKeptRoomsRequired,
  type FoundingCohortKey,
} from '@incircleme/config';
import { trackEvent } from '../../lib/analytics';

// ============================================================================
// Founding-host grant logic — hooked into afterlifeEvaluateTick (handlers.ts).
//
// DECISION 1 — entry predicate:
//   (1) Circle is Kept (circles.keptAt IS NOT NULL) — checked by the caller.
//   (2) Event has ended (events.endsAt < now) — checked by the caller.
//   (3) Event ran with ≥1 confirmed, non-host, non-cancelled attendee.
//       → isolated in hostHadRealAttendee() below.
//
// DECISION 2 — slot accounting:
//   Cap = 50, Gràcia-scoped, config-driven.
//   Slot consumed atomically at first grant; lapse NEVER returns a slot.
//   Public "filled" count = users with founding_status IN ('founding_active',
//   'founding_lapsed'), monotonically increasing.
//
// DECISION 3 — Facet B deferred:
//   v1 always grants 'founding_active'. The active⇄lapsed automation will
//   attach at the stub below — no schema rework needed when it lands.
// ============================================================================

// ----------------------------------------------------------------------------
// (3) "Ran with real room" predicate — isolated so QR check-in tightening is
//     a one-line change here and nowhere else.
//
//     Today: ≥1 booking where status='confirmed' AND cancelledAt IS NULL
//            AND the booker is not the event's host.
//
//     TIGHTENING POINT (checkedInAt): when QR check-in ships, replace the
//     condition body with: status='confirmed' AND checkedInAt IS NOT NULL
//     AND booker != host.  Do NOT change the call-sites.
// ----------------------------------------------------------------------------
export async function hostHadRealAttendee(eventId: string, hostUserId: string): Promise<boolean> {
  const [row] = await db
    .select({ n: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.eventId, eventId),
        eq(bookings.status, 'confirmed'),
        isNull(bookings.cancelledAt),
        // Exclude the host themselves (they may self-book for testing).
        sql`${bookings.userId} != ${hostUserId}`,
      ),
    );
  return (row?.n ?? 0) >= 1;
}

// ----------------------------------------------------------------------------
// Grant the founding badge to a single host, atomically.
//
// Returns 'granted', 'already_has_badge', 'cap_reached', 'no_cohort_match',
// or 'insufficient_kept_rooms'.
// ----------------------------------------------------------------------------
export type GrantOutcome =
  | 'granted'
  | 'already_has_badge'
  | 'cap_reached'
  | 'no_cohort_match'
  | 'insufficient_kept_rooms';

export async function grantFoundingBadgeIfEligible(
  hostUserId: string,
  now: Date,
): Promise<GrantOutcome> {
  return db.transaction(async (tx) => {
    // ── Load the host row (lock it for this transaction) ──────────────────
    const [host] = await tx
      .select({
        id: users.id,
        neighbourhood: users.neighbourhood,
        foundingStatus: users.foundingStatus,
        foundingCohort: users.foundingCohort,
      })
      .from(users)
      .where(eq(users.id, hostUserId))
      .for('update')
      .limit(1);

    if (!host) return 'no_cohort_match'; // defensive; caller already has the user

    // ── Idempotency: already has a badge (active or lapsed) ───────────────
    if (host.foundingStatus !== null) return 'already_has_badge';

    // ── Normalise neighbourhood → cohort key ──────────────────────────────
    const cohort = cohortKeyForNeighbourhood(host.neighbourhood);
    if (!cohort) return 'no_cohort_match';

    // ── Entry gate: required number of Kept Circles ───────────────────────
    // Count Kept Circles this host has (circles linked to their events).
    const [keptCount] = await tx
      .select({ n: count() })
      .from(circles)
      .innerJoin(events, eq(circles.eventId, events.id))
      .where(and(eq(events.hostUserId, hostUserId), isNotNull(circles.keptAt)));

    if ((keptCount?.n ?? 0) < foundingKeptRoomsRequired()) {
      return 'insufficient_kept_rooms';
    }

    // ── Atomic slot acquisition ───────────────────────────────────────────
    // Serialise grants per cohort with an advisory xact lock so the cap check +
    // insert are atomic across concurrent ticks. (Postgres disallows FOR UPDATE
    // with an aggregate, and a row-lock on existing grants would NOT cover a
    // not-yet-inserted grant — so it can't prevent two ticks both taking slot
    // #50. The advisory lock keyed on the cohort does, and auto-releases at
    // transaction end.)
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`founding-cohort:${cohort}`}))`);

    const [filled] = await tx
      .select({ n: count() })
      .from(users)
      .where(
        and(
          eq(users.foundingCohort, cohort),
          // Both active and lapsed consume a slot (Decision 2).
          isNotNull(users.foundingStatus),
        ),
      );

    const cap = foundingHostCap(cohort);
    if ((filled?.n ?? 0) >= cap) return 'cap_reached';

    // ── Grant ─────────────────────────────────────────────────────────────
    await tx
      .update(users)
      .set({
        foundingCohort: cohort,
        foundingStatus: 'founding_active',
        foundingGrantedAt: now,
      })
      .where(
        and(
          eq(users.id, hostUserId),
          // Uniqueness backstop: only write if still null (idempotent guard).
          isNull(users.foundingStatus),
        ),
      );

    // ── Emit the grant as a measurable analytics event ────────────────────
    // (promoted from a bare console.info; single seam, ready for an SDK later)
    trackEvent('founding_host_granted', {
      hostUserId,
      cohort,
      cohortLabel: foundingCohortLabel(cohort as FoundingCohortKey),
      grantedAt: now.toISOString(),
      slotsFilled: (filled?.n ?? 0) + 1,
      cap,
    });

    return 'granted';
  });
}

// ----------------------------------------------------------------------------
// FACET B STUB — upkeep recompute (deferred, Decision 3).
//
// When the trailing-12-month bar ships, attach the daily recompute here.
// It reads ECONOMICS.foundingHost.upkeepBar (checkins, keptCircles, minRating,
// windowMonths) and flips founding_status between 'founding_active' and
// 'founding_lapsed'.  The cohort counter is NEVER touched by this path.
// ----------------------------------------------------------------------------
// export async function recomputeUpkeepStatusTick(now: Date): Promise<number> {
//   // TODO(Facet B): implement trailing-12-month bar check.
//   //   1. Query all users with founding_status IN ('founding_active','founding_lapsed').
//   //   2. For each, compute checkins, keptCircles, avgRating over the prior 12 months.
//   //   3. If bar met and status='founding_lapsed' → flip to 'founding_active'.
//   //      If bar not met and status='founding_active' → flip to 'founding_lapsed'.
//   //   4. Never touch foundingGrantedAt or the cohort slot counter.
//   return 0;
// }
