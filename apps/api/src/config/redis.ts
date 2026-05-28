import { Redis } from 'ioredis';
import { env } from './env.js';

const createRedisClient = (): Redis => {
  const client = new Redis(env.REDIS_URL, {
    retryStrategy(times: number): number | null {
      // Exponential backoff: 100ms, 200ms, 400ms ... capped at 5s
      return Math.min(times * 100, 5000);
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on('connect', () => console.log('[Redis] Connected'));
  client.on('ready', () => console.log('[Redis] Ready'));
  client.on('error', (err: Error) => console.error('[Redis] Error:', err.message));
  client.on('reconnecting', () => console.warn('[Redis] Reconnecting...'));

  return client;
};

export const redis = createRedisClient();

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}