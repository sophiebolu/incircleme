// Onboarding taxonomies for the mobile UI: canonical keys (from @incircleme/config,
// the single source of truth) paired with their i18n label keys + intent emoji.
// The picks persist on the profile via PATCH /me as each step is completed.
import { ONBOARDING } from '@incircleme/config';
import type { StringKey } from '@incircleme/i18n';

export interface IntentTile {
  key: string;
  emoji: string;
  label: StringKey;
  sub: StringKey;
}

export const INTENT_TILES: IntentTile[] = [
  { key: 'slow_down', emoji: '🌿', label: 'onb_intent_slow_down', sub: 'onb_intent_slow_down_sub' },
  { key: 'meet_people', emoji: '👋', label: 'onb_intent_meet_people', sub: 'onb_intent_meet_people_sub' },
  { key: 'learn', emoji: '🌱', label: 'onb_intent_learn', sub: 'onb_intent_learn_sub' },
  { key: 'get_outside', emoji: '⛰️', label: 'onb_intent_get_outside', sub: 'onb_intent_get_outside_sub' },
  { key: 'make_things', emoji: '🎨', label: 'onb_intent_make_things', sub: 'onb_intent_make_things_sub' },
  { key: 'try_bold', emoji: '✨', label: 'onb_intent_try_bold', sub: 'onb_intent_try_bold_sub' },
];

export const INTEREST_PILLS: { key: string; label: StringKey }[] = [
  { key: 'food_drink', label: 'onb_interest_food_drink' },
  { key: 'wellness', label: 'onb_interest_wellness' },
  { key: 'art_craft', label: 'onb_interest_art_craft' },
  { key: 'music', label: 'onb_interest_music' },
  { key: 'nature', label: 'onb_interest_nature' },
  { key: 'learning', label: 'onb_interest_learning' },
];

export const GOAL_PILLS: { key: string; label: StringKey }[] = [
  { key: 'show_up', label: 'onb_goal_show_up' },
  { key: 'meet_faces', label: 'onb_goal_meet_faces' },
  { key: 'host', label: 'onb_goal_host' },
];

const BARRIO_LABELS: Record<string, StringKey> = {
  eixample: 'onb_barrio_eixample',
  gracia: 'onb_barrio_gracia',
  born: 'onb_barrio_born',
  gothic: 'onb_barrio_gothic',
  sant_antoni: 'onb_barrio_sant_antoni',
  poblenou: 'onb_barrio_poblenou',
  barceloneta: 'onb_barrio_barceloneta',
  raval: 'onb_barrio_raval',
  sants: 'onb_barrio_sants',
  sarria: 'onb_barrio_sarria',
};

export const BARRIOS: { key: string; label: StringKey }[] = ONBOARDING.barrios.map((key) => ({
  key,
  label: BARRIO_LABELS[key]!,
}));

export const BARRIO_OTHER = ONBOARDING.barrioOther;
export const MIN_INTERESTS = ONBOARDING.minInterests;
export const ONB_TOTAL_STEPS = 4; // intent · interests · barrio · notifications

// In-memory draft so the interests step can fold the "I'm here to…" goals into the
// same intents[] the intent step seeded, without an extra round-trip. Picks are still
// written to the profile at each step; this is only a within-session convenience.
export const onbDraft: { moodTiles: string[]; goals: string[] } = { moodTiles: [], goals: [] };

export function resetOnbDraft(): void {
  onbDraft.moodTiles = [];
  onbDraft.goals = [];
}
