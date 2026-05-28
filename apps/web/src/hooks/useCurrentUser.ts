'use client';

import { useState, useEffect } from 'react';
import { GraphQLClient } from 'graphql-request';
import { ME_QUERY } from '@/lib/graphql/queries/users';
import type { UserType } from '@/types';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

interface MeResult {
  me: UserType | null;
}

export function useCurrentUser() {
  const [user, setUser]       = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<Error | null>(null);

  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('access_token='))
      ?.split('=')[1];

    if (!token) {
      setLoading(false);
      return;
    }

    const client = new GraphQLClient(`${API_URL}/graphql`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    client
      .request<MeResult>(ME_QUERY)
      .then((data) => setUser(data.me))
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error('Unknown error')))
      .finally(() => setLoading(false));
  }, []);

  const isAuthenticated = Boolean(user);
  const isAdmin  = user?.role === 'admin';
  const isAuthor = user?.role === 'author' || user?.role === 'admin';

  return { user, loading, error, isAuthenticated, isAdmin, isAuthor };
}