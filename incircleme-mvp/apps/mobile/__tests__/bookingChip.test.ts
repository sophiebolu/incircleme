import { bookingChip } from '../lib/bookingChip';
import type { BookingListItem } from '@incircleme/types';

const NOW = Date.parse('2026-07-01T12:00:00Z');
const FUTURE = '2026-07-05T12:00:00Z';
const PAST = '2026-06-20T12:00:00Z';

// bookingChip reads only status / refundStatus / refundCents / event.endsAt.
const mk = (o: {
  status: string;
  refundStatus?: string;
  refundCents?: number;
  endsAt?: string;
}): BookingListItem =>
  ({
    status: o.status,
    refundStatus: o.refundStatus ?? 'none',
    refundCents: o.refundCents ?? 0,
    event: { endsAt: o.endsAt ?? FUTURE },
  }) as unknown as BookingListItem;

describe('bookingChip', () => {
  it('held → neutral chip_held', () => {
    expect(bookingChip(mk({ status: 'held' }), NOW)).toEqual({ key: 'chip_held', tone: 'neutral' });
  });

  it('cancelled + full refund (cents > 0) → ok chip_refunded', () => {
    expect(bookingChip(mk({ status: 'cancelled', refundStatus: 'full', refundCents: 2000 }), NOW)).toEqual({
      key: 'chip_refunded',
      tone: 'ok',
    });
  });

  it('full refund but 0 cents → falls through to neutral chip_cancelled (no false "refunded")', () => {
    expect(bookingChip(mk({ status: 'cancelled', refundStatus: 'full', refundCents: 0 }), NOW)).toEqual({
      key: 'chip_cancelled',
      tone: 'neutral',
    });
  });

  it('cancelled + pending → pending chip_refundPending', () => {
    expect(bookingChip(mk({ status: 'cancelled', refundStatus: 'pending', refundCents: 2000 }), NOW)).toEqual({
      key: 'chip_refundPending',
      tone: 'pending',
    });
  });

  it('cancelled + failed → warn chip_refundFailed', () => {
    expect(bookingChip(mk({ status: 'cancelled', refundStatus: 'failed', refundCents: 2000 }), NOW)).toEqual({
      key: 'chip_refundFailed',
      tone: 'warn',
    });
  });

  it('cancelled + no refund → neutral chip_cancelled', () => {
    expect(bookingChip(mk({ status: 'cancelled', refundStatus: 'none' }), NOW)).toEqual({
      key: 'chip_cancelled',
      tone: 'neutral',
    });
  });

  it('status "refunded" + full → ok chip_refunded (same path as cancelled)', () => {
    expect(bookingChip(mk({ status: 'refunded', refundStatus: 'full', refundCents: 2000 }), NOW)).toEqual({
      key: 'chip_refunded',
      tone: 'ok',
    });
  });

  it('confirmed + event ended → ok chip_attended', () => {
    expect(bookingChip(mk({ status: 'confirmed', endsAt: PAST }), NOW)).toEqual({
      key: 'chip_attended',
      tone: 'ok',
    });
  });

  it('confirmed + upcoming → null (live ticket, no chip)', () => {
    expect(bookingChip(mk({ status: 'confirmed', endsAt: FUTURE }), NOW)).toBeNull();
  });
});
