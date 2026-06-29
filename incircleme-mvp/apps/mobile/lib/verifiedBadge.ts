// Single predicate for the "verified" badge so the Passport gates the same way the profile,
// public profile, and HostRow already do — and so there's ONE place to change when the backing
// signal becomes a real identity check.
//
// TODAY this is `users.verified`, which is set at signup → effectively true for every user. It
// is NOT yet a real identity verification; a true KYC / Stripe-Connect signal is future work
// (backlog §E). When that lands, swap the field read here (and adopt this predicate on the
// other surfaces) rather than re-deriving the rule in each screen.
export function showVerifiedBadge(x: { verified: boolean }): boolean {
  return x.verified === true;
}
