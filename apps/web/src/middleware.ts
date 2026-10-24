import { NextResponse, type NextRequest } from 'next/server';
import { normalizeBaseUrl } from '@/lib/api-url';

// ──────────────────────────────────────────────────────────────────
// Session refresh for server-rendered pages.
//
// The access token cookie lives only ~15 minutes. Server Components cannot set
// cookies, so this middleware runs before each page request: if the access
// token is missing or about to expire and a refresh cookie exists, it asks the
// API for a new access token, then
//   1. forwards it on the request, so the page being rendered sees it, and
//   2. sets it on the response, so the browser stores it.
// Anonymous visitors (no refresh cookie) pass straight through at no cost.
// ──────────────────────────────────────────────────────────────────

const API_BASE = normalizeBaseUrl(
  process.env['INTERNAL_API_URL'] ??
    process.env['NEXT_PUBLIC_API_URL'] ??
    'http://localhost:4000',
);

const REFRESH_MUTATION = 'mutation RefreshSession { refreshToken { user { id } } }';

// Refresh when fewer than this many seconds remain on the access token.
const REFRESH_SKEW_SECONDS = 30;

/** Seconds until the JWT expires, read from its payload (not verified here; the API verifies). */
function secondsUntilExpiry(token: string): number {
  try {
    const part = token.split('.')[1];
    if (!part) return 0;
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return json.exp ? json.exp - Math.floor(Date.now() / 1000) : 0;
  } catch {
    return 0;
  }
}

/** Splits a Set-Cookie header into its name and value. */
function cookiePair(setCookie: string): { name: string; value: string } | null {
  const first = setCookie.split(';')[0];
  const eq = first?.indexOf('=') ?? -1;
  if (!first || eq < 1) return null;
  return { name: first.slice(0, eq).trim(), value: first.slice(eq + 1).trim() };
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (!refreshToken) return NextResponse.next();

  const accessToken = request.cookies.get('access_token')?.value;
  if (accessToken && secondsUntilExpiry(accessToken) > REFRESH_SKEW_SECONDS) {
    return NextResponse.next();
  }

  let setCookies: string[] = [];
  try {
    const apiResponse = await fetch(`${API_BASE}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refresh_token=${refreshToken}`,
        ...(process.env['INTERNAL_API_KEY']
          ? { 'x-internal-key': process.env['INTERNAL_API_KEY'] }
          : {}),
      },
      body: JSON.stringify({ query: REFRESH_MUTATION }),
    });
    setCookies = apiResponse.headers.getSetCookie();
  } catch {
    // API unreachable: let the request through; the page will treat the user as signed out.
    return NextResponse.next();
  }

  if (setCookies.length === 0) return NextResponse.next();

  // 1. Make the new cookies visible to the page being rendered right now.
  const requestHeaders = new Headers(request.headers);
  const jar = new Map<string, string>();
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const pair = cookiePair(part);
    if (pair) jar.set(pair.name, pair.value);
  }
  for (const header of setCookies) {
    const pair = cookiePair(header);
    if (!pair) continue;
    // A cleared cookie (empty value) means the session is gone.
    if (pair.value === '') jar.delete(pair.name);
    else jar.set(pair.name, pair.value);
  }
  requestHeaders.set(
    'cookie',
    Array.from(jar, ([name, value]) => `${name}=${value}`).join('; '),
  );

  // 2. Store them in the browser.
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const header of setCookies) response.headers.append('set-cookie', header);
  return response;
}

export const config = {
  // Pages only: skip static files, images and other assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|webmanifest|xml|txt)$).*)'],
};