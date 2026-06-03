// apps/api/src/tests/helpers/db.ts
/**
 * Test database helper.
 *
 * Uses a real PostgreSQL instance pointed to by TEST_DATABASE_URL.
 * In CI this is a Docker container; locally you can run:
 *   docker run -d -p 5433:5432 -e POSTGRES_PASSWORD=test -e POSTGRES_DB=pentimes_test postgres:16.3-alpine3.20
 *
 * Set TEST_DATABASE_URL=postgresql://postgres:test@localhost:5433/pentimes_test
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import path from 'path';
import * as schema from '../../db/schema/index.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getTestDb() {
  if (!db) {
    throw new Error('Test DB not initialised. Call setupTestDb() first.');
  }
  return db;
}

export async function setupTestDb() {
  const url =
    process.env['TEST_DATABASE_URL'] ||
    'postgresql://postgres:test@localhost:5433/pentimes_test';

  pool = new Pool({ connectionString: url, max: 3 });
  db = drizzle(pool, { schema });

  await migrate(db, {
    migrationsFolder: path.resolve(
      new URL(import.meta.url).pathname,
      '../../../../db/migrations'
    ),
  });

  return db;
}

export async function teardownTestDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export async function cleanTables() {
  if (!db) return;
  // Order respects FK constraints
  await db.execute(
    // @ts-expect-error raw sql
    `TRUNCATE TABLE
      bookmarks, likes, comments,
      article_categories, articles,
      categories, scheduled_programs, users
    RESTART IDENTITY CASCADE`
  );
}