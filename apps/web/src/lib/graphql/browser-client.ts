import { GraphQLClient } from 'graphql-request';

// ──────────────────────────────────────────────────────────────────
// Browser-side API access.
//
// Auth lives in HttpOnly cookies that JavaScript cannot read, so requests just
// send cookies (credentials: 'include'). When the short-lived access token has
// expired, the API answers 401 / UNAUTHENTICATED; we then ask it for a new
// access token using the refresh cookie and retry the request once.
// ──────────────────────────────────────────────────────────────────

export const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
const GRAPHQL_URL = `${API_URL}/graphql`;

const REFRESH_MUTATION = 'mutation RefreshSession { refreshToken { user { id } } }';

/**
 * True when a non-HttpOnly marker cookie says a session exists. This is only
 * a UI hint (Sign in vs Sign out); the API is what actually checks the tokens.
 */
export function hasSession(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith('session_active='));
}

// One refresh at a time: if several requests fail together, they share it.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(GRAPHQL_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: REFRESH_MUTATION }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const json = (await res.json()) as { errors?: unknown[] };
        return !json.errors?.length;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function isUnauthenticated(res: Response): Promise<boolean> {
  if (res.status === 401) return true;

  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('json')) return false;

  try {
    const json = (await res.clone().json()) as {
      errors?: Array<{ extensions?: { code?: string } }>;
    };
    return Boolean(json.errors?.some((e) => e.extensions?.code === 'UNAUTHENTICATED'));
  } catch {
    return false;
  }
}

/**
 * fetch() that always sends cookies and transparently refreshes an expired
 * session once. Request bodies must be re-sendable (strings / JSON), which is
 * true for every GraphQL and upload call in this app.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const options: RequestInit = { ...init, credentials: 'include' };

  const first = await fetch(input, options);
  if (!(await isUnauthenticated(first))) return first;

  // Nothing to refresh with (never signed in): return the original answer.
  if (!hasSession()) return first;

  const refreshed = await refreshSession();
  if (!refreshed) return first;

  return fetch(input, options);
}

/** GraphQL client for authenticated calls from client components. */
export function getAuthClient(): GraphQLClient {
  return new GraphQLClient(GRAPHQL_URL, {
    credentials: 'include',
    fetch: authFetch,
  });
}