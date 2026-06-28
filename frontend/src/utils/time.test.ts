import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from './time';

describe('formatRelativeTime', () => {
  const base = new Date('2026-06-26T12:00:00Z');

  const at = (secondsAgo: number) => new Date(base.getTime() - secondsAgo * 1000);

  it('renders "just now" for very recent times', () => {
    expect(formatRelativeTime(at(0), base)).toBe('just now');
    expect(formatRelativeTime(at(4), base)).toBe('just now');
  });

  it('renders seconds', () => {
    expect(formatRelativeTime(at(5), base)).toBe('5s ago');
    expect(formatRelativeTime(at(59), base)).toBe('59s ago');
  });

  it('renders minutes', () => {
    expect(formatRelativeTime(at(60), base)).toBe('1m ago');
    expect(formatRelativeTime(at(59 * 60), base)).toBe('59m ago');
  });

  it('renders hours', () => {
    expect(formatRelativeTime(at(60 * 60), base)).toBe('1h ago');
    expect(formatRelativeTime(at(23 * 60 * 60), base)).toBe('23h ago');
  });

  it('renders days', () => {
    expect(formatRelativeTime(at(24 * 60 * 60), base)).toBe('1d ago');
  });

  it('treats future timestamps as "just now"', () => {
    expect(formatRelativeTime(at(-10), base)).toBe('just now');
  });
});
