// Minimal server-side analytics event seam.
//
// Today this emits a single structured (greppable / log-parseable) JSON line so a
// log-based pipeline can already measure events. It is the ONE place to later fan
// out to a real sink (PostHog / an events table) — Phase 5 (5.3) of the
// Launch-Readiness Remediation Plan. Call sites do not change when that lands.

/** Stable event names. Extend as instrumentation grows. */
export type AnalyticsEvent = 'founding_host_granted';

/**
 * Emit a structured analytics event. The payload is a single JSON line:
 *   {"evt":"founding_host_granted","ts":"…","hostUserId":"…",…}
 * Stable shape so it is parseable now and swappable for an SDK call later.
 */
export function trackEvent(event: AnalyticsEvent, props: Record<string, unknown> = {}): void {
  console.info(JSON.stringify({ evt: event, ts: new Date().toISOString(), ...props }));
}
