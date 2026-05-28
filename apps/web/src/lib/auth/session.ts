import { cookies } from 'next/headers';
import { getServerClient } from '@/lib/graphql/client';
import { ME_QUERY } from '@/lib/graphql/queries/users';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'reader' | 'author' | 'admin';
  bio: string | null;
  createdAt: string;
}

interface MeQueryResult {
  me: SessionUser | null;
}

/**
 * Get the current authenticated user from the server.
 * Returns null if not authenticated.
 * Use in Server Components and Server Actions.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;

    const client = await getServerClient();
    const data = await client.request<MeQueryResult>(ME_QUERY);
    return data.me ?? null;
  } catch {
    return null;
  }
}

/**
 * Check if the current user has a specific role.
 */
export async function requireRole(
  ...roles: Array<'reader' | 'author' | 'admin'>
): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }
  if (!roles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

/**
 * Check if any auth token cookie exists (fast check, no API call).
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get('access_token')?.value);
}