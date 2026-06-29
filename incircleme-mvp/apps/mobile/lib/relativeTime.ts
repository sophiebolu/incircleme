/**
 * Compact relative time for the notifications inbox: "·" (<1 min), "Nm" (<1 h), "Nh" (<1 d),
 * else "Nd". `now` is injected so the boundaries are testable. (m/h/d are near-universal
 * abbreviations across CA/ES/EN; a fully-localized relative-time helper is a separate
 * backlog item.) Future timestamps clamp to "·".
 */
export function relativeTime(iso: string, now: number): string {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return '·';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}
