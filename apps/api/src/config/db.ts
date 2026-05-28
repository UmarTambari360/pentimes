// ──────────────────────────────────────────────────────────────────
// Database Configuration — Drizzle ORM + pg Pool
//
// WHY connection pooling:
//   Each incoming request should reuse an existing TCP connection
//   to PostgreSQL rather than opening a new one. Without pooling,
//   each request pays the TCP + TLS handshake cost (~5–20ms).
//   With a pool of 20, we handle bursts without overwhelming the DB.
// ──────────────────────────────────────────────────────────────────

import { drizzle } from 'drizzle-orm/node-postgres';
import pg          from 'pg';
import { env, isProd } from './env.js';
import * as schema     from '../db/schema/index.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: isProd ? 20 : 5,
  min: 2,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: isProd ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
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