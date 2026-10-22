import jwt                  from 'jsonwebtoken';
import type { Response }    from 'express';
import { isProd }           from '../config/env.js';

// ──────────────────────────────────────────────────────────────────
// Cookie names
//   access_token   — short-lived JWT, HttpOnly (JavaScript cannot read it)
//   refresh_token  — long-lived JWT, HttpOnly
//   session_active — NOT HttpOnly, contains no secret. It only tells the
//                    browser UI "a session exists" (the real tokens are
//                    invisible to JavaScript), so it can show Sign in / Sign out.
// ──────────────────────────────────────────────────────────────────
export const ACCESS_COOKIE  = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
export const SESSION_COOKIE = 'session_active';

/** Remaining lifetime of a signed JWT in milliseconds (from its own exp claim). */
function msUntilExpiry(token: string): number {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const exp = decoded?.exp;
  return exp ? Math.max(exp * 1000 - Date.now(), 0) : 0;
}

const baseOptions = {
  secure:   isProd,
  sameSite: 'lax' as const,
  path:     '/',
};

/** Set (or refresh) the access cookie only. Used after a token refresh. */
export function setAccessCookie(res: Response, accessToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseOptions,
    httpOnly: true,
    maxAge: msUntilExpiry(accessToken),
  });
}

/** Set all auth cookies after login / register. */
export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  const refreshMaxAge = msUntilExpiry(tokens.refreshToken);

  setAccessCookie(res, tokens.accessToken);
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions,
    httpOnly: true,
    maxAge: refreshMaxAge,
  });
  res.cookie(SESSION_COOKIE, '1', {
    ...baseOptions,
    httpOnly: false,
    maxAge: refreshMaxAge,
  });
}

/** Remove every auth cookie (logout, or a refresh token that is no longer valid). */
export function clearAuthCookies(res: Response): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, SESSION_COOKIE]) {
    res.clearCookie(name, {
      ...baseOptions,
      httpOnly: name !== SESSION_COOKIE,
    });
  }
}