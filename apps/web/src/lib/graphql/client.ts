import { GraphQLClient } from 'graphql-request';
import { cookies } from 'next/headers';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
const GRAPHQL_ENDPOINT = `${API_URL}/graphql`;

/**
 * Server-side GraphQL client.
 * Reads the access_token cookie automatically on the server.
 * Used in Server Components and Route Handlers.
 */
export async function getServerClient(): Promise<GraphQLClient> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
    cache: 'no-store',
  });
}

/**
 * Unauthenticated server client for public data.
 * Suitable for SSR/SSG pages where no auth is needed.
 */
export const publicClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  cache: 'no-store',
});

/**
 * Helper: fetch with revalidation for public data (e.g. article listings).
 */
export function cachedClient(revalidateSeconds = 300): GraphQLClient {
  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    next: { revalidate: revalidateSeconds },
  } as RequestInit & { next?: { revalidate?: number } } as never);
}