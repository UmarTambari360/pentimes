import { Redis }      from 'ioredis';
import { env, isDev } from './env.js';

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    retryStrategy(times: number): number | null {
      if (times > 10) {
        // Give up after 10 retries — let the health check catch it
        return null;
      }
      // Exponential back-off: 100ms, 200ms, 400ms… capped at 10s
      return Math.min(times * 100, 10_000);
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck:     true,
    lazyConnect:          false,
    connectionName: 'pentimes_api',
  });

  client.on('connect', () => logRedis('info',  'redis_connected', {}));
  client.on('ready',   () => logRedis('info',  'redis_ready',     {}));
  client.on('error', (err) => logRedis('error', 'redis_error', { message: err.message }));
  client.on('reconnecting', () => logRedis('warn',  'redis_reconnecting', {}));
  client.on('close',   () => logRedis('warn',  'redis_connection_closed', {}));

  return client;
}

function logRedis(
  level: 'info' | 'warn' | 'error', event: string, 
  data: Record<string, unknown>): void {
  if (isDev) {
    console[level](`[Redis] ${event}`, data);
  } else {
    process.stdout.write(
      JSON.stringify({ level, event, ...data, ts: new Date().toISOString() }) + '\n'
    );
  }
}

export const redis = createRedisClient();

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}