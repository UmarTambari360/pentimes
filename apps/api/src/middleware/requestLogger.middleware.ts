import type { RequestHandler } from 'express';
import { isDev } from '../config/env.js';

/**
 * Request logger middleware.
 *
 * In development: human-readable "METHOD /path STATUS ms"
 * In production: structured JSON logs for log aggregators
 *
 * WHY custom instead of morgan?
 * morgan's 'combined' format is line-based text — hard to parse
 * programmatically. JSON logs let Datadog/CloudWatch/Loki index
 * every field without a custom parser.
 */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const entry = {
      method:     req.method,
      path:       req.path,
      status:     res.statusCode,
      duration_ms: duration,
      ip:         req.ip,
      user_agent: req.get('user-agent') ?? '',
      ts:         new Date().toISOString(),
    };

    // Skip health check spam in logs
    if (req.path === '/health') return;

    if (isDev) {
      const colour =
        res.statusCode >= 500 ? '\x1b[31m'   // red
        : res.statusCode >= 400 ? '\x1b[33m' // yellow
        : res.statusCode >= 300 ? '\x1b[36m' // cyan
        : '\x1b[32m';                         // green
      console.log(
        `${colour}${entry.method}\x1b[0m ${entry.path} ${colour}${entry.status}\x1b[0m ${entry.duration_ms}ms`
      );
    } else {
      process.stdout.write(JSON.stringify({ level: 'info', event: 'http_request', ...entry }) + '\n');
    }
  });

  next();
};