// apps/api/src/helpers/logger.ts
//
// WHY a custom logger instead of console.log:
//   console.log produces unstructured text that is impossible to query in
//   production log aggregators (Datadog, Loki, CloudWatch, etc.).
//   Structured JSON logs let you filter by level, requestId, userId, or
//   errorCode without regex gymnastics.
//
//   We keep it dependency-free (no winston/pino) so the API image stays
//   small and there is zero config overhead.  If the team later wants
//   pino's async transport, swapping this file is a one-liner.

import { isDev } from '../config/env.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  // In development: pretty-print so it is readable in the terminal.
  // In production:  one JSON object per line — ready for log shippers.
  if (isDev) {
    const color: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info:  '\x1b[32m', // green
      warn:  '\x1b[33m', // yellow
      error: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';
    const prefix = `${color[level]}[${level.toUpperCase()}]${reset}`;
    const metaStr = meta ? ` ${JSON.stringify(meta, null, 2)}` : '';
    console[level === 'debug' ? 'log' : level](`${prefix} ${message}${metaStr}`);
  } else {
    process.stdout.write(JSON.stringify(entry) + '\n');
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write('debug', message, meta),
  info:  (message: string, meta?: Record<string, unknown>) => write('info',  message, meta),
  warn:  (message: string, meta?: Record<string, unknown>) => write('warn',  message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
} as const;