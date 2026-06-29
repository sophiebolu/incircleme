import type { BookingListItem } from '@incircleme/types';

export type ChipTone = 'neutral' | 'ok' | 'pending' | 'warn';
export type ChipKey =
  | 'chip_held'
  | 'chip_cancelled'
  | 'chip_refunded'
  | 'chip_refundPending'
  | 'chip_refundFailed'
  | 'chip_attended';

/**
 * Status + refund-state → the bookings-list chip (key + tone). Pure; `now` is injected so the
 * past/upcoming split is testable. Returns null for a confirmed-upcoming booking (it shows the
 * live ticket, not a status chip).
 */
export function bookingChip(b: BookingListItem, now: number): { key: ChipKey; tone: ChipTone } | null {
  if (b.status === 'held') return { key: 'chip_held', tone: 'neutral' };
  if (b.status === 'cancelled' || b.status === 'refunded') {
    // Post-commit refunds can be in-flight or failed — surface the money state, don't go silent.
    if (b.refundStatus === 'full' && b.refundCents > 0) return { key: 'chip_refunded', tone: 'ok' };
    if (b.refundStatus === 'pending') return { key: 'chip_refundPending', tone: 'pending' };
    if (b.refundStatus === 'failed') return { key: 'chip_refundFailed', tone: 'warn' };
    return { key: 'chip_cancelled', tone: 'neutral' };
  }
  if (b.status === 'confirmed' && new Date(b.event.endsAt).getTime() < now)
    return { key: 'chip_attended', tone: 'ok' };
  return null; // confirmed + upcoming → the live ticket, no status chip
}
