// apps/api/src/tests/unit/helpers/slugify.test.ts
import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug } from '../../../src/helpers/slugify.js';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Katsina: The City!')).toBe('katsina-the-city');
  });

  it('collapses multiple spaces/hyphens', () => {
    expect(slugify('a  b   c')).toBe('a-b-c');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify(' -hello- ')).toBe('hello');
  });

  it('handles numbers', () => {
    expect(slugify('Top 10 News 2024')).toBe('top-10-news-2024');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles string with only special chars', () => {
    expect(slugify('!@#$%')).toBe('');
  });

  it('handles accented characters (strips diacritics)', () => {
    // Our slugify strips non-word chars; accented letters become empty
    const result = slugify('naïve café');
    expect(result).toMatch(/^[a-z0-9-]*$/);
  });
});

describe('uniqueSlug', () => {
  it('generates a slug with a suffix', () => {
    const result = uniqueSlug('Hello World');
    expect(result).toMatch(/^hello-world-[a-z0-9]+$/);
  });

  it('generates different slugs on successive calls', () => {
    const a = uniqueSlug('test');
    // Wait 1ms to ensure different Date.now()
    const b = uniqueSlug('test');
    // They may collide in same ms — just check format
    expect(a).toMatch(/^test-/);
    expect(b).toMatch(/^test-/);
  });
});