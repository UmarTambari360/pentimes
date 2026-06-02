import './config/env.js';

import express        from 'express';
import cors           from 'cors';
import helmet         from 'helmet';
import morgan         from 'morgan';
import cookieParser   from 'cookie-parser';
import { createYoga } from 'graphql-yoga';

import { env, isDev }          from './config/env.js';
import { checkDatabaseHealth } from './config/db.js';
import { checkRedisHealth }    from './config/redis.js';
import { schema }              from './graphql/schema.js';
import { createContext }       from './graphql/context.js';
import { formatError }         from './graphql/error-formatter.js';
import { errorHandler }        from './middleware/errorHandler.middleware.js';
import { createRateLimiter }   from './middleware/rateLimiter.middleware.js';
import { uploadRouter }        from './routes/upload.route.js';
import { logger }              from './helpers/logger.js';

const app = express();

// ── Security headers ────────────────────────────────────────────────────────
const helmetConfig = {
  crossOriginEmbedderPolicy: false,
  ...(isDev ? { contentSecurityPolicy: false } : {}),
};
app.use(helmet(helmetConfig));

// ── CORS ────────────────────────────────────────────────────────────────────
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
  }),
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── HTTP request logging ─────────────────────────────────────────────────────
// In production we pipe morgan output through our structured logger so all
// logs end up in the same JSON format for log aggregators.
if (isDev) {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) =>
          logger.info('http', { request: message.trim() }),
      },
    }),
  );
}

// ── Rate limiters ─────────────────────────────────────────────────────────────
app.use('/graphql', createRateLimiter({ max: 100, windowMs: 15 * 60 * 1000 }));
app.use('/upload',  createRateLimiter({ max: 20,  windowMs: 15 * 60 * 1000 }));

// ── Health check ──────────────────────────────────────────────────────────────
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
      database: dbHealthy ? 'ok' : 'error',
      redis:    redisHealthy ? 'ok' : 'error',
    },
    environment: env.NODE_ENV,
  });
});

// ── Upload routes ─────────────────────────────────────────────────────────────
app.use('/upload', uploadRouter);

// ── GraphQL (Yoga) ────────────────────────────────────────────────────────────
const yoga = createYoga({
  schema,
  context: createContext,
  graphiql: isDev ? { title: 'Pen Times API — GraphiQL' } : false,
  // Wire our custom error formatter so every GraphQL error is logged,
  // sanitised, and enriched with extensions.code before it reaches the client.
  formatError,
  maskedErrors: false, // We handle masking ourselves inside formatError.
  cors: false,         // CORS is handled by the Express middleware above.
  logging: false,      // We handle logging ourselves.
});

app.use('/graphql', yoga);

// ── Express error handler (REST routes only) ──────────────────────────────────
// This must come AFTER all routes. GraphQL errors are handled by formatError.
app.use(errorHandler);

// ── 404 fallthrough ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: {
      message: 'The requested endpoint does not exist.',
      code: 'NOT_FOUND',
    },
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
const server = app.listen(env.API_PORT, () => {
  logger.info('Server started', {
    graphql: `http://localhost:${env.API_PORT}/graphql`,
    health:  `http://localhost:${env.API_PORT}/health`,
    env:     env.NODE_ENV,
  });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal: string) => {
  logger.info(`Received ${signal} — shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
  // Force exit if graceful shutdown takes too long.
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Unhandled rejections / exceptions ─────────────────────────────────────────
// WHY: Any unhandled rejection that escapes our try/catch must be logged
// before the process crashes so we have a record of what happened.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack:  reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — process will exit', {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});