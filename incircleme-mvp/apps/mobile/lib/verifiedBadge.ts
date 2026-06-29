// Single source of truth for whether to show the "Identitat verificada" badge, used by every
// surface (Passport, public profile, own profile, HostRow).
//
// HIDDEN EVERYWHERE FOR NOW. `users.verified` is set true at account creation — it is NOT an
// identity check — so rendering an "identity verified" badge off it overclaims trust, which
// undermines the Reputation Passport. We show NO verified badge until a real identity signal
// exists (host KYC / Stripe Connect identity verification).
//
// SEAM — when real verification lands, gate here off the real field, e.g.:
//   return !!user.identityVerifiedAt;
// The badge markup on all four surfaces is already gated behind this call, so it lights back up.
export function showVerifiedBadge(_user: { verified: boolean }): boolean {
  return false;
}
