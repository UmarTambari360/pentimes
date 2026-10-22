import { redis } from '../config/redis.js';
import { CACHE_TTL } from '@pentimes/shared';

// ── Key Factories ─────────────────────────────────────────────────
export const CacheKeys = {
  articles: (page: number, limit: number, categorySlug?: string) =>
    `articles:list:${page}:${limit}${categorySlug ? `:cat:${categorySlug}` : ''}`,

  article: (slug: string) => `articles:single:${slug}`,

  categories: () => 'categories:all',

  programs: (status?: string) =>
    `programs:list${status ? `:${status}` : ''}`,

  /**
   * Normalise the query to lowercase before hashing into the key.
   * Without this, "Nigeria" and "nigeria" would be two separate cache
   * entries — wasting memory and bypassing cached results.
   */
  search: (query: string, offset: number, limit: number) =>
    `search:${query.toLowerCase().trim()}:${offset}:${limit}`,

  session: (userId: string) => `session:${userId}`,
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
      // Invalidate all search caches too — new/updated articles affect results
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

    // ── Refresh sessions ─────────────────────────────────────────────
  // One Redis key per login (session id), so signing in on a second device
  // does not sign out the first. The value is a SHA-256 hash of the refresh
  // token, so a Redis leak does not hand out usable tokens.
  async setRefreshSession(
    userId: string,
    sessionId: string,
    tokenHash: string,
    ttlSeconds: number,
  ): Promise<void> {
    await redis.setex(`refresh:${userId}:${sessionId}`, ttlSeconds, tokenHash);
  },

  async getRefreshSession(userId: string, sessionId: string): Promise<string | null> {
    return redis.get(`refresh:${userId}:${sessionId}`);
  },

  async deleteRefreshSession(userId: string, sessionId: string): Promise<void> {
    await redis.del(`refresh:${userId}:${sessionId}`);
  },

  /** Sign the user out everywhere (e.g. after a password change). */
  async deleteAllRefreshSessions(userId: string): Promise<void> {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `refresh:${userId}:*`, 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  },
  async setSession(
    userId: string,
    session: { id: string; role: string; email: string },
  ): Promise<void> {
    await redis.setex(
      CacheKeys.session(userId),
      CACHE_TTL.ARTICLES,
      JSON.stringify(session),
    );
  },

  async getSession(userId: string) {
    return this.get<{ id: string; role: string; email: string }>(
      CacheKeys.session(userId),
    );
  },

  async deleteSession(userId: string): Promise<void> {
    await redis.del(CacheKeys.session(userId));
  },
};