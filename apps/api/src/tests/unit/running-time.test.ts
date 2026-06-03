// apps/api/src/tests/unit/helpers/reading-time.test.ts
import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from '../../../src/helpers/reading-time.js';

describe('calculateReadingTime', () => {
  it('returns at least 1 minute for very short content', () => {
    expect(calculateReadingTime('short')).toBe(1);
  });

  it('returns 1 for content under 200 words', () => {
    const content = 'word '.repeat(150);
    expect(calculateReadingTime(content)).toBe(1);
  });

  it('returns 2 for ~300 words', () => {
    const content = 'word '.repeat(300);
    expect(calculateReadingTime(content)).toBe(2);
  });

  it('returns correct value for long article', () => {
    const content = 'word '.repeat(1000);
    // 1000 / 200 = 5
    expect(calculateReadingTime(content)).toBe(5);
  });

  it('rounds up fractional minutes', () => {
    const content = 'word '.repeat(201);
    // 201/200 = 1.005 → ceil → 2
    expect(calculateReadingTime(content)).toBe(2);
  });

  it('handles empty string', () => {
    expect(calculateReadingTime('')).toBe(1);
  });

  it('handles content with extra whitespace', () => {
    const content = 'word   '.repeat(200);
    expect(calculateReadingTime(content)).toBeGreaterThanOrEqual(1);
  });
});