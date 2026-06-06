import './config/env.js';

import express        from 'express';
import cors           from 'cors';
import helmet         from 'helmet';
import cookieParser   from 'cookie-parser';
import { createYoga } from 'graphql-yoga';

import { env, isDev }          from './config/env.js';
import { checkDatabaseHealth } from './config/db.js';
import { checkRedisHealth }    from './config/redis.js';
import { schema }              from './graphql/schema.js';
import { createContext }       from './graphql/context.js';
import { errorHandler }        from './middleware/errorHandler.middleware.js';
import { createRateLimiter }   from './middleware/rateLimiter.middleware.js';
import { uploadRouter }        from './routes/upload.route.js';
import { requestLogger }       from './middleware/requestLogger.middleware.js';

const app = express();

// ── Security headers ─────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: isDev ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
    },
  },
}));

// ── CORS ─────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'apollo-require-preflight',
    ],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────────
// Structured JSON in production, human-readable in dev
app.use(requestLogger);

// ── Rate limiting ─────────────────────────────────────────────────
app.use('/graphql', createRateLimiter({ max: 100, windowMs: 15 * 60 * 1000 }));
app.use('/upload',  createRateLimiter({ max: 20,  windowMs: 15 * 60 * 1000 }));

// ── Health check ─────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const [dbHealthy, redisHealthy] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  const status = dbHealthy && redisHealthy ? 'ok' : 'degraded';

  res.status(status === 'ok' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy   ? 'ok' : 'error',
      redis:    redisHealthy ? 'ok' : 'error',
    },
    version: process.env['npm_package_version'] ?? 'unknown',
    environment: env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
  });
});

// ── File uploads ──────────────────────────────────────────────────
app.use('/upload', uploadRouter);

// ── GraphQL ───────────────────────────────────────────────────────
const yoga = createYoga({
  schema,
  context: createContext,
  graphiql: isDev ? { title: 'Pen Times API — GraphiQL' } : false,
  maskedErrors: !isDev,
  cors: false,
  logging: isDev,
});

app.use('/graphql', yoga);

// ── Error handler (must be last) ─────────────────────────────────
app.use(errorHandler);
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

// ── Server startup ────────────────────────────────────────────────
const server = app.listen(env.API_PORT, () => {
  log('info', 'server_started', {
    graphql:  `http://localhost:${env.API_PORT}/graphql`,
    health:   `http://localhost:${env.API_PORT}/health`,
    env:      env.NODE_ENV,
    port:     env.API_PORT,
  });
});

// ── Graceful shutdown ─────────────────────────────────────────────
const shutdown = (signal: string) => {
  log('info', 'shutdown_initiated', { signal });
  server.close(() => {
    log('info', 'shutdown_complete', {});
    process.exit(0);
  });
  setTimeout(() => {
    log('error', 'shutdown_forced', { reason: 'timeout' });
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Unhandled rejection guard
process.on('unhandledRejection', (reason) => {
  log('error', 'unhandled_rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  log('error', 'uncaught_exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

// ── Structured logger ─────────────────────────────────────────────
export function log(
  level: 'info' | 'warn' | 'error',
  event: string,
  data: Record<string, unknown>
): void {
  if (isDev) {
    const icon = level === 'error' ? '✗' : level === 'warn' ? '⚠' : '✓';
    console[level](`[${event}]`, icon, data);
  } else {
    process.stdout.write(
      JSON.stringify({ level, event, ...data, ts: new Date().toISOString() }) + '\n'
    );
  }
}