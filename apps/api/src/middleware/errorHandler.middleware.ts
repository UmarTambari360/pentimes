import type { ErrorRequestHandler } from 'express';
import { isDev }                    from '../config/env.js';

export class ApiError extends Error {
  constructor(
    public override readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, field?: string): ApiError {
    return new ApiError(message, 400, 'BAD_REQUEST', field);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource: string): ApiError {
    return new ApiError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409, 'CONFLICT');
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(message, 500, 'INTERNAL_ERROR');
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        ...(err.field ? { field: err.field } : {}),
      },
    });
    return;
  }

  const statusCode =
    'status' in err && typeof err.status === 'number' ? err.status : 500;

  console.error('[Error]', err);

  res.status(statusCode).json({
    error: {
      message: isDev ? (err as Error).message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(isDev ? { stack: (err as Error).stack } : {}),
    },
  });
};