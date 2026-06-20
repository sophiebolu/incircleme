-- Founding Host · Gràcia badge schema (v1).
--
-- Adds three columns to `users` that track the founding-host lifecycle:
--   founding_cohort     — cohort key snapshotted at grant ('gracia' | null).
--   founding_status     — null | 'founding_active' | 'founding_lapsed'.
--   founding_granted_at — immutable timestamp of first grant; never reset on lapse.
--
-- The UNIQUE constraint (users_founding_grant_uq) on (id, founding_cohort) is the
-- DB-level backstop for atomic slot acquisition: two concurrent job ticks cannot
-- both grant slot #50 to two different hosts, because the application acquires a
-- row-level lock (SELECT … FOR UPDATE) inside a transaction before writing.
-- The unique constraint ensures one grant per (user, cohort) even across retries.
--
-- NOTE: Postgres UNIQUE indexes treat NULLs as distinct, so rows with
-- founding_cohort = NULL (non-founding hosts) are NOT constrained by this index —
-- only actual grants (founding_cohort IS NOT NULL) are deduplicated.
--
-- DO NOT apply this migration against any DB without explicit sign-off.
-- Run via: pnpm --filter @incircleme/db migrate (after review).

ALTER TABLE "users" ADD COLUMN "founding_cohort" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "founding_status" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "founding_granted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_founding_grant_uq" UNIQUE("id","founding_cohort");
