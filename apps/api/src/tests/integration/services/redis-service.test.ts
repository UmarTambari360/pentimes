// apps/api/src/tests/unit/services/redis.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ioredis before importing the service
vi.mock('../../../config/redis.js', () => {
  const store = new Map<string, string>();
  const pipeline = {
    del: vi.fn(),
    exec: vi.fn().mockResolvedValue([]),
  };
  const mockRedis = {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    setex: vi.fn(async (key: string, _ttl: number, value: string) => { store.set(key, value); return 'OK'; }),
    del: vi.fn(async (...keys: string[]) => { keys.forEach(k => store.delete(k)); return keys.length; }),
    pipeline: vi.fn(() => pipeline),
    scanStream: vi.fn(() => {
      const emitter = { on: vi.fn() } as unknown;
      // Immediately emit 'end'
      setTimeout(() => {
        const handlers = new Map<string, (...args: unknown[]) => void>();
        (emitter as { on: (e: string, fn: (...args: unknown[]) => void) => void }).on = (event: string, fn: (...args: unknown[]) => void) => {
          handlers.set(event, fn);
          if (event === 'end') setTimeout(fn, 0);
        };
      }, 0);
      return emitter;
    }),
    ping: vi.fn().mockResolvedValue('PONG'),
  };
  return { redis: mockRedis };
});

const { cacheService, CacheKeys } = await import('../../../services/redis.service.js');

describe('cacheService.get / set / del', () => {
  it('returns null for missing key', async () => {
    const result = await cacheService.get('nonexistent');
    expect(result).toBeNull();
  });

  it('stores and retrieves JSON data', async () => {
    const data = { id: '123', name: 'Test' };
    await cacheService.set('test:key', data, 60);
    const retrieved = await cacheService.get<typeof data>('test:key');
    expect(retrieved).toEqual(data);
  });

  it('deletes a key', async () => {
    await cacheService.set('del:key', { x: 1 }, 60);
    await cacheService.del('del:key');
    const result = await cacheService.get('del:key');
    expect(result).toBeNull();
  });
});

describe('cacheService refresh token helpers', () => {
  it('sets and gets a refresh token', async () => {
    await cacheService.setRefreshToken('user123', 'mytoken');
    const token = await cacheService.getRefreshToken('user123');
    expect(token).toBe('mytoken');
  });

  it('deletes a refresh token', async () => {
    await cacheService.setRefreshToken('user456', 'sometoken');
    await cacheService.deleteRefreshToken('user456');
    const token = await cacheService.getRefreshToken('user456');
    expect(token).toBeNull();
  });
});

describe('CacheKeys', () => {
  it('articles key includes page and limit', () => {
    const key = CacheKeys.articles(0, 12);
    expect(key).toContain('0');
    expect(key).toContain('12');
  });

  it('article key includes slug', () => {
    const key = CacheKeys.article('my-article-slug');
    expect(key).toContain('my-article-slug');
  });

  it('categories key is stable', () => {
    expect(CacheKeys.categories()).toBe(CacheKeys.categories());
  });

  it('search key includes query', () => {
    const key = CacheKeys.search('katsina', 0, 12);
    expect(key).toContain('katsina');
  });
});