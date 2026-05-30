'use client';

import { useState, useCallback } from 'react';
import { GraphQLClient } from 'graphql-request';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  LOGOUT_MUTATION,
} from '@/lib/graphql/queries/users';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

const client = new GraphQLClient(`${API_URL}/graphql`, {
  credentials: 'include',
});

interface AuthPayload {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  accessToken: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

// Set cookie helper
function setAccessToken(token: string) {
  document.cookie = `access_token=${token}; path=/; max-age=${15 * 60}; SameSite=Lax`;
}

// Clear cookie helper
function clearAccessToken() {
  document.cookie =
    'access_token=; path=/; max-age=0; SameSite=Lax';
}

// Format GraphQL error message
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message
      .replace(/^GraphQL Error:\s*/i, '')
      .replace(/\[GraphQL\]:\s*/i, '')
      .split('\n')[0] ?? 'An unexpected error occurred.';
  }
  return 'An unexpected error occurred.';
}

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const login = useCallback(
    async (input: LoginInput) => {
      setLoading(true);
      try {
        const data = await client.request<{ login: AuthPayload }>(
          LOGIN_MUTATION,
          { input }
        );
        setAccessToken(data.login.accessToken);

        toast.success(`Welcome back, ${data.login.user.name}!`);

        // Role-based redirect
        const role = data.login.user.role;
        if (role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
        return data.login;
      } catch (err) {
        toast.error(extractErrorMessage(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      setLoading(true);
      try {
        const data = await client.request<{ register: AuthPayload }>(
          REGISTER_MUTATION,
          { input }
        );
        setAccessToken(data.register.accessToken);

        toast.success(`Welcome to Pen Times, ${data.register.user.name}!`);
        router.push('/dashboard');
        router.refresh();
        return data.register;
      } catch (err) {
        toast.error(extractErrorMessage(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // Best-effort server logout
      await client.request(LOGOUT_MUTATION).catch(() => {});
    } finally {
      clearAccessToken();
      toast.success('Signed out successfully.');
      router.push('/');
      router.refresh();
      setLoading(false);
    }
  }, [router]);

  return { login, register, logout, loading };
}