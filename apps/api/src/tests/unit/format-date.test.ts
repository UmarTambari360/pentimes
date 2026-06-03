// apps/api/src/tests/unit/helpers/format-date.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, isExpired } from '../../../src/helpers/format-date.js';

describe('formatDate', () => {
  it('returns an ISO 8601 string from a Date', () => {
    const date = new Date('2024-06-15T10:00:00.000Z');
    const result = formatDate(date);
    expect(result).toBe('2024-06-15T10:00:00.000Z');
  });

  it('returns an ISO string from a date string', () => {
    const result = formatDate('2024-01-01');
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('isExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for a past date', () => {
    expect(isExpired(new Date('2024-06-15T11:59:59.000Z'))).toBe(true);
  });

  it('returns false for a future date', () => {
    expect(isExpired(new Date('2024-06-15T12:00:01.000Z'))).toBe(false);
  });

  it('returns true for a date string in the past', () => {
    expect(isExpired('2020-01-01')).toBe(true);
  });
});