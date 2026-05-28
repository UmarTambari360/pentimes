import { redis }     from '../config/redis.js';
import { CACHE_TTL } from '@pentimes/shared';

// ── Key Factories ─────────────────────────────────────────────────
export const CacheKeys = {
  articles: (page: number, limit: number, categorySlug?: string) =>
    `articles:list:${page}:${limit}${categorySlug ? `:cat:${categorySlug}` : ''}`,
  article: (slug: string) => `articles:single:${slug}`,
  categories: () => 'categories:all',
  programs: (status?: string) => `programs:list${status ? `:${status}` : ''}`,
  search: (query: string, offset: number, limit: number) =>
    `search:${query}:${offset}:${limit}`,
  session: (userId: string) => `session:${userId}`,
  refreshToken: (userId: string) => `refresh:${userId}`,
} as const;

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  },

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await redis.del(...keys);
  },

  async delPattern(pattern: string): Promise<void> {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const pipeline = redis.pipeline();
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (keys: string[]) => {
        if (keys.length > 0) pipeline.del(...keys);
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    await pipeline.exec();
  },

  async invalidateArticleCache(slug?: string): Promise<void> {
    const tasks: Promise<void>[] = [
      this.delPattern('articles:list:*'),
      this.delPattern('search:*'),
    ];
    if (slug) tasks.push(this.del(CacheKeys.article(slug)));
    await Promise.all(tasks);
  },

  async invalidateCategoryCache(): Promise<void> {
    await Promise.all([
      this.del(CacheKeys.categories()),
      this.delPattern('articles:list:*'),
    ]);
  },

  async setRefreshToken(userId: string, token: string): Promise<void> {
    await redis.setex(CacheKeys.refreshToken(userId), 7 * 24 * 60 * 60, token);
  },

  async getRefreshToken(userId: string): Promise<string | null> {
    return redis.get(CacheKeys.refreshToken(userId));
  },

  async deleteRefreshToken(userId: string): Promise<void> {
    await redis.del(CacheKeys.refreshToken(userId));
  },

  async setSession(
    userId: string,
    session: { id: string; role: string; email: string }
  ): Promise<void> {
    await redis.setex(
      CacheKeys.session(userId),
      CACHE_TTL.ARTICLES,
      JSON.stringify(session)
    );
  },

  async getSession(userId: string) {
    return this.get<{ id: string; role: string; email: string }>(
      CacheKeys.session(userId)
    );
  },

  async deleteSession(userId: string): Promise<void> {
    await redis.del(CacheKeys.session(userId));
  },
};