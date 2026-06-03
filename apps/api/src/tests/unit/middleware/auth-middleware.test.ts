// apps/api/src/tests/unit/middleware/auth.middleware.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Set env before importing middleware
process.env['JWT_SECRET'] = 'test-secret-at-least-32-chars-long!!';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-32-chars-long!';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5433/test';
process.env['REDIS_URL'] = 'redis://localhost:6379';
process.env['CLOUDINARY_CLOUD_NAME'] = 'test';
process.env['CLOUDINARY_API_KEY'] = 'test';
process.env['CLOUDINARY_API_SECRET'] = 'test';

const { authenticate, requireRole } = await import('../../../middleware/auth.middleware.js');

function mockReq(headers: Record<string, string> = {}, cookies: Record<string, string> = {}) {
  return { headers, cookies } as unknown as Request;
}

function mockRes() {
  return {} as Response;
}

function mockNext() {
  return vi.fn() as NextFunction;
}

describe('authenticate middleware', () => {
  it('calls next with error for missing token', () => {
    const next = mockNext();
    authenticate(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with error for invalid token', () => {
    const next = mockNext();
    const req = mockReq({ authorization: 'Bearer invalid.token.here' });
    authenticate(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('attaches user to req for valid token', () => {
    const token = jwt.sign(
      { sub: 'user-id', email: 'test@example.com', role: 'reader' },
      process.env['JWT_SECRET']!,
      { expiresIn: '1h' }
    );
    const next = mockNext();
    const req = mockReq({ authorization: `Bearer ${token}` }) as Request & { user?: unknown };
    authenticate(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
    expect((req.user as { email: string }).email).toBe('test@example.com');
  });

  it('reads token from cookie as fallback', () => {
    const token = jwt.sign(
      { sub: 'user-id', email: 'cookie@example.com', role: 'author' },
      process.env['JWT_SECRET']!,
      { expiresIn: '1h' }
    );
    const next = mockNext();
    const req = mockReq({}, { access_token: token }) as Request & { user?: unknown };
    authenticate(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect((req.user as { email: string }).email).toBe('cookie@example.com');
  });

  it('calls next with error for expired token', () => {
    const token = jwt.sign(
      { sub: 'user-id', email: 'old@example.com', role: 'reader' },
      process.env['JWT_SECRET']!,
      { expiresIn: '-1s' } // already expired
    );
    const next = mockNext();
    const req = mockReq({ authorization: `Bearer ${token}` });
    authenticate(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe('requireRole middleware', () => {
  it('allows matching role', () => {
    const next = mockNext();
    const req = { user: { sub: 'id', role: 'admin', email: 'a@t.com' } } as unknown as Request;
    requireRole('admin')(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks non-matching role', () => {
    const next = mockNext();
    const req = { user: { sub: 'id', role: 'reader', email: 'r@t.com' } } as unknown as Request;
    requireRole('admin')(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('blocks unauthenticated request', () => {
    const next = mockNext();
    const req = { user: undefined } as unknown as Request;
    requireRole('admin')(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});