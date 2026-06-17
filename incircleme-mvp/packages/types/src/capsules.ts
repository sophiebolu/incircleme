// Memory Capsule — auto-generated 12h after event end, Circle-only, permanent.
// "Silent, not stigmatised": members who skipped Arriving simply don't appear —
// no empty slots, no callouts. The types make absence unrepresentable.

export interface DifferencePair {
  userId: string;
  displayName: string | null;
  beforeUrl: string;
  afterUrl: string;
  beforeAt: string;
  afterAt: string;
}

export interface CapsulePhoto {
  url: string;
  userId: string | null;
}

export interface CapsuleStats {
  members: number;
  /** How many members shared both arriving photos. */
  sharedBoth: number;
  photos: number;
  messages: number;
  keptAt: string | null;
}

export interface Capsule {
  id: string;
  circleId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  neighbourhood: string | null;
  heroPhotoUrl: string | null;
  stats: CapsuleStats;
  /** Active Circle members (member-gated read) — for the "Your Circle" avatar strip. */
  members: { displayName: string | null; avatarUrl: string | null }[];
  photos: CapsulePhoto[];
  differencePairs: DifferencePair[];
  /** Empty until reviews land (Slice 6). */
  quotes: { body: string; authorName: string | null }[];
  generatedAt: string;
}
