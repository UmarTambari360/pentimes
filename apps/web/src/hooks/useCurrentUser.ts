'use client';

import { useState, useEffect } from 'react';
import { ME_QUERY } from '@/lib/graphql/queries/users';
import { getAuthClient, hasSession } from '@/lib/graphql/browser-client';
import type { UserType } from '@/types';

interface MeResult {
  me: UserType | null;
}

export function useCurrentUser() {
  const [user, setUser]       = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<Error | null>(null);

  useEffect(() => {
    // The tokens are HttpOnly, so JavaScript cannot see them. A readable
    // marker cookie tells us whether it is worth asking the API who we are.
    if (!hasSession()) {
      setLoading(false);
      return;
    }

    getAuthClient()
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