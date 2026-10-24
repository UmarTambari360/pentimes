// apps/web/src/tests/unit/api-url.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeBaseUrl } from '../../lib/api-url.js';

describe('normalizeBaseUrl', () => {
  it('leaves a clean URL untouched', () => {
    expect(normalizeBaseUrl('https://pentimes.ng')).toBe('https://pentimes.ng');
  });

  it('removes a single trailing slash', () => {
    expect(normalizeBaseUrl('https://api.example.app/')).toBe('https://api.example.app');
  });

  it('removes multiple trailing slashes', () => {
    expect(normalizeBaseUrl('https://api.example.app///')).toBe('https://api.example.app');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeBaseUrl('  http://localhost:4000/ \n')).toBe('http://localhost:4000');
  });

  it('keeps path segments and avoids a double slash when joined', () => {
    expect(`${normalizeBaseUrl('https://x.app/api/')}/graphql`).toBe('https://x.app/api/graphql');
  });
});
