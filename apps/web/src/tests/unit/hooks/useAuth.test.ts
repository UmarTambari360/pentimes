// apps/web/src/tests/unit/hooks/useAuth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../../hooks/useAuth.js';

// `useAuth` creates its GraphQLClient once at import time, so the mocked
// `request` fn must be shared (hoisted) and reconfigured per test.
const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

// Keep the real `gql` export (query modules need it); replace only the client.
// A class is used because the hook calls `new GraphQLClient(...)`.
vi.mock('graphql-request', async (importOriginal) => ({
  ...(await importOriginal<typeof import('graphql-request')>()),
  GraphQLClient: class {
    request = mockRequest;
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('useAuth', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    mockRequest.mockReset();
    mockRequest.mockResolvedValue({
      login: {
        user: { id: 'u1', name: 'Test', email: 'test@test.com', role: 'author' },
      },
    });
  });

  it('starts with loading=false', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(false);
  });

  it('login sets loading true then false', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: 'Password123' });
    });

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
  });

  it('login handles error gracefully', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth());

    await expect(
      act(async () => {
        await result.current.login({ email: 'bad@test.com', password: 'wrong' });
      })
    ).rejects.toThrow();

    expect(result.current.loading).toBe(false);
  });
});
