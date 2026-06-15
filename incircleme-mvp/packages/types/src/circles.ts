import type { EventListItem } from './events';

export type CircleRole = 'host' | 'attendee';

export interface CircleMember {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: CircleRole;
}

export interface CircleMessage {
  id: string;
  circleId: string;
  userId: string;
  body: string;
  /** Original language (Addendum A); null until detection lands in Phase 2. */
  language: 'ca' | 'es' | 'en' | null;
  attachments: MessageAttachment[] | null;
  createdAt: string;
}

export interface MessageAttachment {
  type: 'photo' | 'arriving' | 'leaving';
  url: string;
  expiresAt?: string;
}

export interface CircleSummary {
  id: string;
  eventId: string;
  eventTitle: string;
  opensAt: string;
  closesAt: string;
  keptAt: string | null;
  memberCount: number;
  lastMessageAt: string | null;
  hasCapsule: boolean;
}

export interface CircleDetail {
  id: string;
  event: EventListItem & { address: string | null; addressLocked: boolean };
  opensAt: string;
  closesAt: string;
  keptAt: string | null;
  members: CircleMember[];
  recentMessages: CircleMessage[];
  /** Current user's afterlife vote, if cast. */
  myKeepVote: boolean | null;
  /** Count of yes votes so far (threshold 4 → kept). */
  keepYesCount: number;
}

export interface PostMessageRequest {
  body: string;
  attachments?: MessageAttachment[];
}

export interface KeepVoteRequest {
  vote: boolean;
}

export type ArrivingState = 'before' | 'after';

export interface ArrivingMoment {
  id: string;
  eventId: string;
  userId: string;
  state: ArrivingState;
  photoUrl: string;
  chatExpiresAt: string;
  takenAt: string;
}

// Socket.io payloads — server emits into room `circle:{circleId}`.
export interface SocketMessageNew {
  circleId: string;
  message: CircleMessage;
}
