import type { RequestHandler } from 'express';
import { 
  verifyAccessToken, 
  type JwtPayload }            from '../services/auth.service.js';
import { ApiError }            from './errorHandler.middleware.js';
import type { UserRole }       from '@pentimes/shared';

export type { JwtPayload };

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate: RequestHandler = (req, _res, next) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token as string;
    }

    if (!token) {
      throw ApiError.unauthorized('No authentication token provided');
    }

    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : ApiError.unauthorized('Invalid or expired token'));
  }
};

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    next();
  };
}