import { drizzle }     from 'drizzle-orm/node-postgres';
import pg              from 'pg';
import { env, isProd } from './env.js';
import * as schema     from '../db/schema/index.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Production: more connections for concurrency
  // Development: fewer to avoid overloading local Postgres
  max:                     isProd ? 20 : 5,
  min:                     2,
  idleTimeoutMillis:       30_000,
  connectionTimeoutMillis: 10_000,
  // Required for Heroku/Render/Railway SSL — safe to set on self-hosted too
  ssl: isProd ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  process.stdout.write(
    JSON.stringify({
      level: 'error',
      event: 'db_pool_error',
      message: err.message,
      ts: new Date().toISOString(),
    }) + '\n'
  );
});

pool.on('connect', () => {
  if (!isProd) console.log('[DB] New client connected to pool');
});

export const db = drizzle(pool, {
  schema,
  logger: !isProd,
});

export { pool };

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}