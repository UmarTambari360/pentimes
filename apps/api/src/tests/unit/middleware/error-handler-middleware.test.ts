// apps/api/src/tests/unit/middleware/errorHandler.middleware.test.ts
import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { ApiError, errorHandler } from '../../../middleware/errorHandler.middleware.js';

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('ApiError', () => {
  it('creates a 400 bad request', () => {
    const err = ApiError.badRequest('Invalid input', 'email');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.field).toBe('email');
  });

  it('creates a 401 unauthorized', () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
  });

  it('creates a 403 forbidden', () => {
    const err = ApiError.forbidden();
    expect(err.statusCode).toBe(403);
  });

  it('creates a 404 not found', () => {
    const err = ApiError.notFound('Article');
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain('Article');
  });

  it('creates a 409 conflict', () => {
    const err = ApiError.conflict('Email already exists');
    expect(err.statusCode).toBe(409);
  });
});

describe('errorHandler middleware', () => {
  it('formats ApiError correctly', () => {
    const err = ApiError.badRequest('Invalid email', 'email');
    const res = mockRes();

    errorHandler(err, {} as Request, res, (() => {}) as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: 'Invalid email',
        code: 'BAD_REQUEST',
        field: 'email',
      }),
    });
  });

  it('returns 500 for unknown errors', () => {
    const err = new Error('Unexpected failure');
    const res = mockRes();

    errorHandler(err, {} as Request, res, (() => {}) as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});