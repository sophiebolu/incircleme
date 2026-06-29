import { relativeTime } from '../lib/relativeTime';

const NOW = Date.parse('2026-07-01T12:00:00Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const M = 60_000;
const H = 60 * M;
const D = 24 * H;

describe('relativeTime', () => {
  it('< 1 min → "·"', () => {
    expect(relativeTime(ago(0), NOW)).toBe('·');
    expect(relativeTime(ago(20_000), NOW)).toBe('·'); // 20s
  });
  it('minutes', () => {
    expect(relativeTime(ago(5 * M), NOW)).toBe('5m');
    expect(relativeTime(ago(59 * M), NOW)).toBe('59m');
  });
  it('hour boundary: 60 min → "1h"', () => {
    expect(relativeTime(ago(60 * M), NOW)).toBe('1h');
  });
  it('hours up to <24h', () => {
    expect(relativeTime(ago(3 * H), NOW)).toBe('3h');
    expect(relativeTime(ago(23 * H), NOW)).toBe('23h');
  });
  it('day boundary: 24h → "1d"', () => {
    expect(relativeTime(ago(24 * H), NOW)).toBe('1d');
  });
  it('multiple days', () => {
    expect(relativeTime(ago(5 * D), NOW)).toBe('5d');
  });
  it('future timestamp clamps to "·"', () => {
    expect(relativeTime(new Date(NOW + 3 * H).toISOString(), NOW)).toBe('·');
  });
});
