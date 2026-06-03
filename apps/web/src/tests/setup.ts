// apps/web/src/tests/setup.ts
import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Mock next/navigation globally
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/image globally
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return { type: 'img', props: { src, alt, ...props } };
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
});