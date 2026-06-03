// apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'api',
    environment: 'node',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/helpers/**',
        'src/services/**',
        'src/queries/**',
        'src/middleware/**',
        'src/graphql/resolvers/**',
      ],
      exclude: ['src/tests/**', 'src/db/migrations/**'],
    },
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
  resolve: {
    alias: {
      '@pentimes/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});