// apps/web/src/hooks/useGraphQLMutation.ts
//
// WHY this hook:
//   Every client component that runs a GraphQL mutation needs to:
//     1. Track loading state.
//     2. Parse the error into a user message.
//     3. Show a Sonner toast on success or failure.
//   Without a shared hook this logic is duplicated in every component.
//   This hook centralises it and gives components a clean API:
//
//     const { mutate, loading } = useGraphQLMutation(CREATE_ARTICLE, {
//       onSuccess: (data) => router.push('/dashboard'),
//       successMessage: 'Article created!',
//     });

'use client';

import { useState, useCallback } from 'react';
import { GraphQLClient }         from 'graphql-request';
import { toast }                 from 'sonner';
import { getErrorMessage }       from '@/lib/errors';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

function getAuthClient(): GraphQLClient {
  const token = document.cookie
    .split('; ')
    .find((r) => r.startsWith('access_token='))
    ?.split('=')[1];

  return new GraphQLClient(`${API_URL}/graphql`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
}

interface MutationOptions<TData, TVariables> {
  /** Variables to pass to the mutation. */
  variables?: TVariables;
  /** Called with the response data on success. */
  onSuccess?: (data: TData) => void | Promise<void>;
  /** Called with the raw error on failure (after toast is shown). */
  onError?: (err: unknown) => void;
  /** Toast message shown on success. Omit to skip the success toast. */
  successMessage?: string;
  /** Override the error toast message. Defaults to parsed GraphQL error. */
  errorMessage?: string;
}

interface MutationResult<TData, TVariables> {
  mutate: (options?: MutationOptions<TData, TVariables>) => Promise<TData | null>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useGraphQLMutation<TData = unknown, TVariables = Record<string, unknown>>(
  document: string,
): MutationResult<TData, TVariables> {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  const mutate = useCallback(
    async (options: MutationOptions<TData, TVariables> = {}): Promise<TData | null> => {
      const { variables, onSuccess, onError, successMessage, errorMessage } = options;
      setLoading(true);
      setError(null);

      try {
        const client = getAuthClient();
        const data   = await client.request<TData>(document, variables ?? {});

        if (successMessage) {
          toast.success(successMessage);
        }

        await onSuccess?.(data);
        return data;
      } catch (err) {
        const message = errorMessage ?? getErrorMessage(err);
        setError(message);
        toast.error(message);
        onError?.(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [document],
  );

  return { mutate, loading, error, reset };
}