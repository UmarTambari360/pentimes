import { createHash, timingSafeEqual } from 'node:crypto';
import rateLimit                      from 'express-rate-limit';
import { RedisStore }                 from 'rate-limit-redis';
import type { Request, RequestHandler } from 'express';
import { redis }                      from '../config/redis.js';
import { env }                        from '../config/env.js';

interface RateLimiterOptions {
  /** Unique name — used as the Redis key prefix so limiters never share counters */
  name: string;
  max: number;
  windowMs: number;
  message?: string;
  /** Return true to skip rate limiting for this request */
  skip?: (req: Request) => boolean;
}

const sha256 = (value: string): Buffer => createHash('sha256').update(value).digest();

/**
 * True when the request carries the shared secret that only the Next.js
 * server knows. Used so server-side rendering (which comes from ONE IP for
 * all visitors) does not exhaust the per-IP /graphql rate limit.
 * Compared in constant time; hashing first makes both buffers equal length.
 */
export function isInternalRequest(req: Request): boolean {
  const expected = env.INTERNAL_API_KEY;
  if (!expected) return false;

  const provided = req.header('x-internal-key');
  if (!provided) return false;

  return timingSafeEqual(Uint8Array.from(sha256(provided)), Uint8Array.from(sha256(expected)));
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
    ...(options.skip ? { skip: options.skip } : {}),
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