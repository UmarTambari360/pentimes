import { defineConfig } from 'drizzle-kit';
import * as dotenv      from 'dotenv';
import path             from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

if (!process.env['DATABASE_URL']) {
  throw new Error('DATABASE_URL is required for drizzle-kit');
}

export default defineConfig({
  schema: './src/db/schema/index.ts',        // ← Better: use barrel file
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'],
  },
  verbose: true,
  strict: true,
});