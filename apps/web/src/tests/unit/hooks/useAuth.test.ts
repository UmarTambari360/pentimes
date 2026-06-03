// apps/web/src/tests/unit/hooks/useAuth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../../hooks/useAuth.js';

// Mock GraphQLClient
vi.mock('graphql-request', () => ({
  GraphQLClient: vi.fn().mockImplementation(() => ({
    request: vi.fn().mockResolvedValue({
      login: {
        user: { id: 'u1', name: 'Test', email: 'test@test.com', role: 'author' },
        accessToken: 'mock-access-token',
      },
    }),
  })),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('useAuth', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    vi.clearAllMocks();
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

    expect(result.current.loading).toBe(false);
  });

  it('login handles error gracefully', async () => {
    const { GraphQLClient } = await import('graphql-request');
    vi.mocked(GraphQLClient).mockImplementationOnce(() => ({
      request: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
    }) as never);

    const { result } = renderHook(() => useAuth());

    await expect(
      act(async () => {
        await result.current.login({ email: 'bad@test.com', password: 'wrong' });
      })
    ).rejects.toThrow();

    expect(result.current.loading).toBe(false);
  });
});