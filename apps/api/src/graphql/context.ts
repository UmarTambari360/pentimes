import type { YogaInitialContext } from 'graphql-yoga';
import jwt                         from 'jsonwebtoken';
import { db }                      from '../config/db.js';
import { cacheService }            from '../services/redis.service.js';
import { env }                     from '../config/env.js';
import type { UserRole }           from '@pentimes/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface GraphQLContext {
  db: typeof db;
  cache: typeof cacheService;
  currentUser: AuthUser | null;
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, pair) => {
    const [key, value] = pair.trim().split('=');
    if (key && value) {
      acc[key.trim()] = decodeURIComponent(value.trim());
    }
    return acc;
  }, {});
}

export async function createContext(
  initialContext: YogaInitialContext
): Promise<GraphQLContext> {
  const request = initialContext.request; // Web Fetch Request
  let currentUser: AuthUser | null = null;

  try {
    let token: string | undefined;

    // 1. Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    // 2. Fallback to cookie
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        token = cookies['access_token'];
      }
    }

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        sub: string;
        email: string;
        role: UserRole;
      };

      currentUser = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
    }
  } catch {
    currentUser = null;
  }

  return {
    db,
    cache: cacheService,
    currentUser,
  };
}