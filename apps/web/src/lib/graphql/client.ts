import { GraphQLClient } from 'graphql-request';
import { cookies } from 'next/headers';

// Server-side calls prefer the internal Docker address (INTERNAL_API_URL, e.g.
// http://api:4000). This skips the public internet/TLS round trip. It falls
// back to the public URL when unset (local development).
const API_URL =
  process.env['INTERNAL_API_URL'] ??
  process.env['NEXT_PUBLIC_API_URL'] ??
  'http://localhost:4000';
const GRAPHQL_ENDPOINT = `${API_URL}/graphql`;

// Shared secret that tells the API this call comes from our Next.js server,
// not from a visitor. The API then skips the per-IP rate limit for it, because
// every server-rendered page would otherwise share ONE IP's quota.
// This file is server-only (it imports next/headers) and the variable has no
// NEXT_PUBLIC_ prefix, so the key is never sent to the browser.
const INTERNAL_API_KEY = process.env['INTERNAL_API_KEY'];

function internalHeaders(): Record<string, string> {
  return INTERNAL_API_KEY ? { 'x-internal-key': INTERNAL_API_KEY } : {};
}

/**
 * Server-side GraphQL client.
 * Reads the access_token cookie automatically on the server.
 * Used in Server Components and Route Handlers.
 */
export async function getServerClient(): Promise<GraphQLClient> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: {
      ...internalHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
}

/**
 * Unauthenticated server client for public data.
 * Suitable for SSR/SSG pages where no auth is needed.
 */
export const publicClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: internalHeaders(),
  cache: 'no-store',
});

/**
 * Helper: fetch with revalidation for public data (e.g. article listings).
 */
export function cachedClient(revalidateSeconds = 300): GraphQLClient {
  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: internalHeaders(),
    next: { revalidate: revalidateSeconds },
  } as RequestInit & { next?: { revalidate?: number } } as never);
}