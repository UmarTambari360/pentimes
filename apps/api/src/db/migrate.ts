import { drizzle }       from 'drizzle-orm/node-postgres';
import { migrate }       from 'drizzle-orm/node-postgres/migrator';
import pg                from 'pg';
import * as dotenv       from 'dotenv';
import path              from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Load env — supports both monorepo root and running from dist/
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.production') });

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/**
 * Standalone migration runner.
 *
 * WHY a separate file instead of running migrations inline in index.ts?
 *
 * Running migrations on every server start is dangerous in production:
 * if two instances start simultaneously (rolling deploy), they race
 * each other and can corrupt the migration history table.
 *
 * Instead, migrations run as a one-off step BEFORE the new server
 * instances come up. In our Dockerfile CMD, we run:
 *   node dist/db/migrate.js && node dist/index.js
 *
 * This guarantees exactly-once execution per deployment.
 *
 * Drizzle tracks applied migrations in __drizzle_migrations and is
 * idempotent — re-running this file against an up-to-date database
 * is safe and fast.
 */
async function runMigrations(): Promise<void> {
  if (!process.env['DATABASE_URL']) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'migration_failed',
      message: 'DATABASE_URL is not defined. Cannot run migrations.',
      ts: new Date().toISOString(),
    }));
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
    max: 1,
    connectionTimeoutMillis: 15_000,
  });

  const db = drizzle(pool);

  const sanitisedUrl = process.env['DATABASE_URL'].replace(/:\/\/.*@/, '://<credentials>@');

  console.log(JSON.stringify({
    level: 'info',
    event: 'migration_started',
    target: sanitisedUrl,
    ts: new Date().toISOString(),
  }));

  try {
    // Resolve migrations folder relative to THIS file, whether running
    // from src/ (ts-node) or from dist/ (compiled JS)
    const migrationsFolder = path.resolve(__dirname, 'migrations');

    await migrate(db, { migrationsFolder });

    console.log(JSON.stringify({
      level: 'info',
      event: 'migration_complete',
      message: 'All migrations applied successfully.',
      ts: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'migration_failed',
      message: error instanceof Error ? error.message : String(error),
      ts: new Date().toISOString(),
    }));
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();