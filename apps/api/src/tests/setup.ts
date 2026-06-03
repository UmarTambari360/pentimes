// apps/api/src/tests/setup.ts
import { vi, afterAll, afterEach } from 'vitest';

// Silence console.error in tests unless DEBUG_TESTS=true
if (!process.env['DEBUG_TESTS']) {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
}

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});