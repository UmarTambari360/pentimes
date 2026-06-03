// apps/web/src/tests/unit/utils.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatRelativeDate,
  formatReadingTime,
  truncate,
  getInitials,
  cloudinaryUrl,
} from '../../lib/utils.js';

describe('formatDate', () => {
  it('returns a human-readable date', () => {
    const result = formatDate('2024-06-15T10:00:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(5);
  });

  it('handles invalid date gracefully', () => {
    // Invalid date just returns Invalid Date string — don't throw
    expect(() => formatDate('not-a-date')).not.toThrow();
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for < 1 minute ago', () => {
    const result = formatRelativeDate('2024-06-15T11:59:45.000Z');
    expect(result).toBe('Just now');
  });

  it('returns minutes for < 1 hour ago', () => {
    const result = formatRelativeDate('2024-06-15T11:30:00.000Z');
    expect(result).toMatch(/\d+m ago/);
  });

  it('returns hours for < 1 day ago', () => {
    const result = formatRelativeDate('2024-06-15T06:00:00.000Z');
    expect(result).toMatch(/\d+h ago/);
  });

  it('returns days for < 1 week ago', () => {
    const result = formatRelativeDate('2024-06-12T12:00:00.000Z');
    expect(result).toMatch(/\d+d ago/);
  });

  it('returns formatted date for > 1 week ago', () => {
    const result = formatRelativeDate('2024-01-01T12:00:00.000Z');
    expect(result).not.toMatch(/ago/);
    expect(result.length).toBeGreaterThan(5);
  });
});

describe('formatReadingTime', () => {
  it('returns "< 1 min read" for 0 minutes', () => {
    expect(formatReadingTime(0)).toBe('< 1 min read');
  });

  it('returns "1 min read" for 1 minute', () => {
    expect(formatReadingTime(1)).toBe('1 min read');
  });

  it('returns "5 min read" for 5 minutes', () => {
    expect(formatReadingTime(5)).toBe('5 min read');
  });
});

describe('truncate', () => {
  it('returns original string if shorter than maxLength', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates and adds ellipsis', () => {
    const result = truncate('Hello World', 5);
    expect(result).toContain('…');
    expect(result.length).toBeLessThanOrEqual(6);
  });

  it('returns exact string at maxLength', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

describe('getInitials', () => {
  it('returns initials for a two-word name', () => {
    expect(getInitials('Aisha Bello')).toBe('AB');
  });

  it('returns first initial for a one-word name', () => {
    expect(getInitials('Aisha')).toBe('A');
  });

  it('uses only first two words for longer names', () => {
    expect(getInitials('Aisha Bello Mohammed')).toBe('AB');
  });

  it('uppercases initials', () => {
    expect(getInitials('aisha bello')).toBe('AB');
  });
});

describe('cloudinaryUrl', () => {
  it('returns publicId as-is when no cloud name env', () => {
    delete process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'];
    const result = cloudinaryUrl('my-image-id');
    expect(result).toBe('my-image-id');
  });

  it('builds a correct URL when cloud name is set', () => {
    process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'] = 'mycloudname';
    const result = cloudinaryUrl('my-image-id', { width: 800, crop: 'fill' });
    expect(result).toContain('mycloudname');
    expect(result).toContain('my-image-id');
    expect(result).toContain('w_800');
    expect(result).toContain('c_fill');
    delete process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'];
  });
});