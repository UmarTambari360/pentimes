import { z }             from 'zod';
import dotenv            from 'dotenv';
import path              from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from monorepo root (4 directories up from src/config/)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.production') });

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  API_PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid PostgreSQL connection string'),

  REDIS_URL: z
    .string()
    .url('REDIS_URL must be a valid Redis connection string'),

  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security'),
  JWT_ACCESS_EXPIRY:  z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY:    z
    .string()
    .min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, 'CLOUDINARY_API_SECRET is required'),

  CORS_ORIGIN:    z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN:  z.string().default('localhost'),
  COOKIE_SECURE:  z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Use process.stdout to ensure JSON output even before logger is set up
  process.stdout.write(
    JSON.stringify({
      level: 'error',
      event: 'env_validation_failed',
      errors: parsed.error.flatten().fieldErrors,
      ts: new Date().toISOString(),
    }) + '\n'
  );
  process.exit(1);
}

export const env = parsed.data;

export const isDev  = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';