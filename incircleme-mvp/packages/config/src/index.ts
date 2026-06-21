// ============================================================================
// IncircleMe economics — SINGLE SOURCE OF TRUTH.
//
// Source of truth: Pricing v2 (04-Marketing/IncircleMe_Tier_Plan_2026-04-27 +
// the `project_pricing_model` memory). Every gate / fee / credit path in the
// codebase MUST read from here — no scattered magic numbers. Changing any
// economic condition later is a single edit to this file (a config change, not
// code surgery). If runtime-editable economics are ever needed, back this with
// a settings table behind the same shape — callers won't change.
// ============================================================================

// HostTier is the canonical domain type (@incircleme/types); economics values key off it.
export type { HostTier } from '@incircleme/types';
import type { HostTier, VerificationTier } from '@incircleme/types';

export interface TierEconomics {
  /** Subscription price in cents (Basic free, Pro €35, Premium €80). */
  monthlyPriceCents: number;
  /** Platform transaction fee on bookings, percent (Basic 5, Pro 2, Premium 0). */
  transactionFeePct: number;
}

export const ECONOMICS = {
  /** Verified, certificate-issuing Program submission. */
  programSubmission: {
    /** Which host tiers may submit a Program today. */
    allowedTiers: ['premium'] as HostTier[],
    /** One-time submission fee in cents (€150). */
    feeCents: 15000,
    /** Refunded if the Trust team rejects the Program. */
    feeRefundableOnRejection: true,
  },

  /** Free Program credits granted per tier (Premium includes 1). */
  freeProgramCreditsByTier: { basic: 0, pro: 0, premium: 1 } as Record<HostTier, number>,

  /** Platform fee charged per issued certificate, in cents (currently none). */
  perCertificatePlatformFeeCents: 0,

  /** Refundable seat-hold (creator-optional, default off per event). Returned at check-in. */
  seatHold: { amountCents: 500 },

  /** Tier subscription pricing + booking transaction fee. */
  tiers: {
    basic: { monthlyPriceCents: 0, transactionFeePct: 5 },
    pro: { monthlyPriceCents: 3500, transactionFeePct: 2 },
    premium: { monthlyPriceCents: 8000, transactionFeePct: 0 },
  } as Record<HostTier, TierEconomics>,

  /** Founding-host perks (first 50 hosts). Detection (a founding flag) is not yet
   *  wired — the values are configured and ready for when it is. */
  foundingHost: {
    submissionFeeWaived: true,
    freeProgramsPerYear: 1,
    /** Annual free-Program contingency: all three must hold over the prior 12 months. */
    bar: { minCheckIns: 300, minKeptCircles: 6, minAvgRating: 4.5 },
  },
} as const;

// --- Typed accessors (so call sites read from the config, never inline values) ---

export function canTierSubmitProgram(tier: HostTier): boolean {
  return ECONOMICS.programSubmission.allowedTiers.includes(tier);
}

export function freeProgramCreditsFor(tier: HostTier): number {
  return ECONOMICS.freeProgramCreditsByTier[tier] ?? 0;
}

export function programSubmissionFeeCents(): number {
  return ECONOMICS.programSubmission.feeCents;
}

export function isSubmissionFeeRefundable(): boolean {
  return ECONOMICS.programSubmission.feeRefundableOnRejection;
}

export function seatHoldAmountCents(): number {
  return ECONOMICS.seatHold.amountCents;
}

// ============================================================================
// Trust review (Slice 5 Part 2) — gate criteria, reviewer permissions, tier
// rules. Config-driven so the Trust team can tune the 4-gate review without code
// surgery. Refund-on-reject reads ECONOMICS.programSubmission above (no duplication).
// ============================================================================

export interface ReviewGate {
  id: string;
  label: string;
}

export const TRUST_REVIEW = {
  /** Roles allowed to use the admin review queue. */
  reviewerRoles: ['trust_reviewer'] as string[],
  /** Program statuses that appear in the reviewer queue. */
  queueStatuses: ['pending_review', 'under_review'] as string[],
  /** The 4-gate review checklist (Alina-approved 2026-06-15). */
  gates: [
    {
      id: 'host_standing',
      label: 'Host standing — Premium + good standing, no unresolved trust flags',
    },
    { id: 'curriculum_substance', label: 'Curriculum substance — real, multi-week, coherent' },
    {
      id: 'credentials_verified',
      label: 'Credentials & references verified (accredited adds a valid governing-body link)',
    },
    {
      id: 'assessment_integrity',
      label: 'Assessment integrity — a real completion bar, not a participation sticker',
    },
  ] as ReviewGate[],
  /** Tier rules: verified = gold IncircleMe seal; accredited = forest + governing-body link. */
  tiers: {
    verified: { badge: 'gold', requiresGoverningBody: false },
    accredited: { badge: 'forest', requiresGoverningBody: true },
  } as Record<VerificationTier, { badge: 'gold' | 'forest'; requiresGoverningBody: boolean }>,
} as const;

export function isReviewerRole(role: string): boolean {
  return TRUST_REVIEW.reviewerRoles.includes(role);
}
export function tierRequiresGoverningBody(tier: VerificationTier): boolean {
  return TRUST_REVIEW.tiers[tier].requiresGoverningBody;
}
export function reviewGates(): ReviewGate[] {
  return TRUST_REVIEW.gates;
}
export function reviewQueueStatuses(): string[] {
  return TRUST_REVIEW.queueStatuses;
}

// ============================================================================
// Reviews — canonical config. The vibe-tag set + rating bounds live here (the
// rule), the UI localises labels via i18n `vibe_*` keys. "Would go again" is an
// EXPLICIT yes/no the reviewer taps (reviews.would_go_again) — not derived.
// ============================================================================
export const REVIEWS = {
  ratingMin: 1,
  ratingMax: 5,
  /** Canonical vibe-tag keys (order = display order). Labels are i18n `vibe_*`. */
  vibeTags: [
    'warm_welcome',
    'well_organised',
    'small_group',
    'beautiful_space',
    'easy_to_meet',
    'felt_included',
  ] as const,
} as const;

export type VibeTag = (typeof REVIEWS.vibeTags)[number];

export function isVibeTag(v: string): v is VibeTag {
  return (REVIEWS.vibeTags as readonly string[]).includes(v);
}

// ============================================================================
// Onboarding — canonical preference taxonomies. The CANONICAL KEYS live here
// (the rule); the UI localises labels via i18n `onb_*` keys. Picks persist on
// the user (users.intents / users.interests / users.neighbourhood /
// users.notification_prefs). `interests` deliberately mirrors EventCategory so
// they can shape the Home feed directly.
// ============================================================================
export const ONBOARDING = {
  /** Intent mood-tiles (order = display order). Labels are i18n `onb_intent_*`. */
  intents: ['slow_down', 'meet_people', 'learn', 'get_outside', 'make_things', 'try_bold'] as const,
  /** "I'm here to…" goals on the interests step. Labels are i18n `onb_goal_*`. Persisted in intents[]. */
  goals: ['show_up', 'meet_faces', 'host'] as const,
  /** Canonical interest hashtags (== EventCategory). Labels are i18n `onb_interest_*`. */
  interests: ['food_drink', 'wellness', 'art_craft', 'music', 'nature', 'learning'] as const,
  /** Canonical Barcelona barrios (order = display order). Labels are i18n `onb_barrio_*`. */
  barrios: [
    'eixample',
    'gracia',
    'born',
    'gothic',
    'sant_antoni',
    'poblenou',
    'barceloneta',
    'raval',
    'sants',
    'sarria',
  ] as const,
  /** Sentinel the picker stores for "my barrio isn't on the list". */
  barrioOther: 'other' as const,
  /** Minimum interests we ask the attendee to pick (prototype: "at least 3"). */
  minInterests: 3,
} as const;

export type Intent = (typeof ONBOARDING.intents)[number];
export type OnboardingGoal = (typeof ONBOARDING.goals)[number];
export type Interest = (typeof ONBOARDING.interests)[number];
export type Barrio = (typeof ONBOARDING.barrios)[number];

// Intents persisted on the user combine the mood-tiles and the "I'm here to…" goals.
const ALL_INTENT_KEYS: readonly string[] = [...ONBOARDING.intents, ...ONBOARDING.goals];
export function isIntent(v: string): boolean {
  return ALL_INTENT_KEYS.includes(v);
}
export function isInterest(v: string): v is Interest {
  return (ONBOARDING.interests as readonly string[]).includes(v);
}
export function isBarrio(v: string): boolean {
  return (ONBOARDING.barrios as readonly string[]).includes(v) || v === ONBOARDING.barrioOther;
}
