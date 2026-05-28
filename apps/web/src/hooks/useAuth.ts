'use client';

import { useState, useCallback } from 'react';
import { GraphQLClient } from 'graphql-request';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
    LOGIN_MUTATION, 
    REGISTER_MUTATION, 
    LOGOUT_MUTATION } from '@/lib/graphql/queries/users';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
const client = new GraphQLClient(`${API_URL}/graphql`, { credentials: 'include' });

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

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (input: LoginInput) => {
    setLoading(true);
    try {
      const data = await client.request<{ login: AuthPayload }>(LOGIN_MUTATION, { input });
      // Store token in cookie via API response (httpOnly set by server)
      // The server sets the httpOnly cookie on login response
      // We also store in document.cookie for non-httpOnly access if needed
      document.cookie = `access_token=${data.login.accessToken}; path=/; max-age=${15 * 60}; SameSite=Lax`;
      toast.success(`Welcome back, ${data.login.user.name}!`);

      const role = data.login.user.role;
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'author' || role === 'reader') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
      router.refresh();
      return data.login;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      toast.error(message.replace('GraphQL Error: ', ''));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const register = useCallback(async (input: RegisterInput) => {
    setLoading(true);
    try {
      const data = await client.request<{ register: AuthPayload }>(REGISTER_MUTATION, { input });
      document.cookie = `access_token=${data.register.accessToken}; path=/; max-age=${15 * 60}; SameSite=Lax`;
      toast.success(`Welcome to Pen Times, ${data.register.user.name}!`);
      router.push('/dashboard');
      router.refresh();
      return data.register;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      toast.error(message.replace('GraphQL Error: ', ''));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await client.request(LOGOUT_MUTATION);
    } catch {
      // Ignore errors on logout
    } finally {
      // Clear the cookie
      document.cookie = 'access_token=; path=/; max-age=0';
      toast.success('Logged out successfully');
      router.push('/');
      router.refresh();
      setLoading(false);
    }
  }, [router]);

  return { login, register, logout, loading };
}