import { drizzle }       from 'drizzle-orm/node-postgres';
import { migrate }       from 'drizzle-orm/node-postgres/migrator';
import pg                from 'pg';
import * as dotenv       from 'dotenv';
import path              from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Standalone migration runner.
 *
 * Why a separate file instead of running migrations inline in index.ts?
 * Running migrations on every server start is dangerous in production —
 * if two instances start simultaneously (e.g. a rolling deploy), they
 * race each other and can corrupt the migration history table.
 *
 * Instead, migrations run as a one-off step in the deployment pipeline,
 * before the new server instances come up. This file is that step.
 *
 * In Docker: CMD ["node", "dist/db/migrate.js"] runs first,
 * then the main server starts.
 *
 * Drizzle tracks applied migrations in a __drizzle_migrations table
 * it creates automatically. Running this file is idempotent — it only
 * applies migrations that have not been applied yet.
 */
async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not defined. Cannot run migrations.'
    );
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10_000,
  });

  const db = drizzle(pool);

  console.log('[Migrations] Starting...');
  console.log(`[Migrations] Target: ${process.env.DATABASE_URL.replace(/:\/\/.*@/, '://<credentials>@')}`);

  try {
    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, 'migrations'),
    });

    console.log('[Migrations] All migrations applied successfully.');
  } catch (error) {
    console.error('[Migrations] Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('[Migrations] Connection pool closed.');
  }
}

runMigrations();