import rateLimit               from 'express-rate-limit';
import { RedisStore }          from 'rate-limit-redis';
import type { RequestHandler } from 'express';
import { redis }               from '../config/redis.js';

interface RateLimiterOptions {
  /** Unique name — used as the Redis key prefix so limiters never share counters */
  name: string;
  max: number;
  windowMs: number;
  message?: string;
}

export function createRateLimiter(options: RateLimiterOptions): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too Many Requests',
      message:
        options.message ?? 'Too many requests from this IP. Please try again later.',
    },
    // Fail open: if Redis is down, let requests through instead of returning
    // 500s for every request. The /health endpoint will report Redis as degraded.
    passOnStoreError: true,
    // Shared store so counters survive restarts and work across API replicas
    store: new RedisStore({
      prefix: `rl:${options.name}:`,
      sendCommand: (command: string, ...args: string[]) =>
        redis.call(command, ...args) as Promise<number | string | boolean | (number | string | boolean)[]>,
    }),
  });
}