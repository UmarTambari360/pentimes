import rateLimit               from 'express-rate-limit';
import type { RequestHandler } from 'express';

interface RateLimiterOptions {
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
    skip: (req) => req.path === '/health',
  });
}