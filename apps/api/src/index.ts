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
import { errorHandler }        from './middleware/errorHandler.middleware.js';
import { createRateLimiter }   from './middleware/rateLimiter.middleware.js';
import { uploadRouter }        from './routes/upload.route.js';

const app = express();

const helmetConfig = {
  crossOriginEmbedderPolicy: false,
  ...(isDev ? { contentSecurityPolicy: false } : {}),
};

app.use(helmet(helmetConfig));

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
app.use(morgan(isDev ? 'dev' : 'combined'));

app.use('/graphql', createRateLimiter({ max: 100, windowMs: 15 * 60 * 1000 }));
app.use('/upload', createRateLimiter({ max: 20, windowMs: 15 * 60 * 1000 }));

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
      redis: redisHealthy ? 'ok' : 'error',
    },
    environment: env.NODE_ENV,
  });
});

app.use('/upload', uploadRouter);

const yoga = createYoga({
  schema,
  context: createContext,
  graphiql: isDev ? { title: 'Pen Times API — GraphiQL' } : false,
  maskedErrors: !isDev,
  cors: false,
  logging: isDev,
});

app.use('/graphql', yoga);
app.use(errorHandler);
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

const server = app.listen(env.API_PORT, () => {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✦  Pen Times API
  ━  GraphQL:  http://localhost:${env.API_PORT}/graphql
  ━  Health:   http://localhost:${env.API_PORT}/health
  ━  Env:      ${env.NODE_ENV}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

const shutdown = (signal: string) => {
  console.log(`\n[Server] ${signal} — shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));