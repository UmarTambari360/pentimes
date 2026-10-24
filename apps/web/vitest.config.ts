// apps/web/vitest.config.ts
//
// WHY this file exists:
//   Without it, Vitest runs with defaults: no React/JSX transform, no jsdom,
//   no `@/` path alias, and it picks up the Playwright E2E specs (which use
//   `@playwright/test` and crash under the Vitest runner).
//
//   Unit tests  → `pnpm test`      (Vitest, src/tests/unit/**)
//   E2E tests   → `pnpm test:e2e`  (Playwright, src/tests/e2e/**)

import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Point at the shared package source so tests don't require
      // `pnpm --filter shared build` to have produced dist/ first.
      '@pentimes/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  test: {
    // `globals` is required: setup.ts imports '@testing-library/jest-dom', which
    // extends the global `expect`, and RTL only auto-cleans between tests when
    // a global `afterEach` exists.
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'src/tests/e2e/**'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/tests/**'],
    },
  },
});
