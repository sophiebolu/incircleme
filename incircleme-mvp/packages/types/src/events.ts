import type { EventCategory, HostTier, TrustTier } from './index';
import type { RefundStatus } from './bookings';

export interface HostSummary {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  neighbourhood: string | null;
  trustTier: TrustTier;
  verified: boolean;
  hostTier: HostTier;
  /** Count of non-deleted events this host runs. */
  eventsHosted: number;
}

export interface EventListItem {
  id: string;
  title: string;
  category: EventCategory;
  neighbourhood: string | null;
  startsAt: string;
  endsAt: string;
  seatCount: number;
  seatsBooked: number;
  seatsHeld: number;
  seatsLeft: number;
  roomFull: boolean;
  priceCents: number;
  currency: string;
  photoUrls: string[];
}

export interface EventDetail extends EventListItem {
  description: string | null;
  /** Present only once the address is unlocked (T-1 day); otherwise null. */
  address: string | null;
  addressLocked: boolean;
  durationMinutes: number | null;
  arrivingEnabled: boolean;
  /** Creator-optional refundable seat-hold (default off). */
  depositRequired: boolean;
  /** Seat-hold amount in cents (from config); 0 when no hold is required. */
  depositAmountCents: number;
  host: HostSummary;
}

export interface EventsQuery {
  category?: EventCategory;
  neighbourhood?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  /** Original language of the listing (Addendum A) — creator-set, defaults 'ca'. */
  language?: 'ca' | 'es' | 'en';
  category: EventCategory;
  neighbourhood?: string;
  address?: string;
  startsAt: string;
  endsAt: string;
  seatCount: number;
  priceCents: number;
  photoUrls?: string[];
}

export interface BookRequest {
  seatCount?: number;
}

export interface BookResult {
  bookingId: string;
  clientSecret: string;
  amountCents: number;
  currency: string;
  status: BookingStatus;
}

export type BookingStatus = 'held' | 'confirmed' | 'cancelled' | 'refunded';

export interface BookingListItem {
  id: string;
  status: BookingStatus;
  seatCount: number;
  amountCents: number;
  bookedAt: string;
  event: EventListItem;
  /** The event's Circle, once it exists (created on first confirmed booking). */
  circleId: string | null;
  circleMemberCount: number | null;
  /** Refund outcome — drives the ticket's cancelled sub-state + the list chips. */
  refundStatus: RefundStatus;
  refundCents: number;
  creditIssuedCents: number;
  /** Set once the host has checked the attendee in (drives the ticket's "✓ Checked in" badge). */
  checkedInAt: string | null;
}

/** One confirmed attendee on a host's roster (powers the check-in view + manual fallback). */
export interface EventAttendee {
  bookingId: string;
  attendee: { id: string; displayName: string | null; avatarUrl: string | null };
  /** ISO timestamp once the host has checked them in; null until then. */
  checkedInAt: string | null;
}

/** Lean summary of an event the caller hosts — the entry point to the check-in scanner. */
export interface HostedEventSummary {
  id: string;
  title: string;
  startsAt: string;
  /** Derived (events have no status column): cancelled = soft-deleted, else by time. */
  status: 'upcoming' | 'past' | 'cancelled';
  confirmedCount: number;
  checkedInCount: number;
}
