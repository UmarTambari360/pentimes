import type { ErrorRequestHandler } from 'express';
import { isDev }                    from '../config/env.js';

export class ApiError extends Error {
  details: any;
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

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Structured error logging in production
  const logEntry = {
    level: 'error',
    event: 'request_error',
    method: req.method,
    path: req.path,
    ts: new Date().toISOString(),
  };

  if (err instanceof ApiError) {
    if (!isDev && err.statusCode >= 500) {
      process.stdout.write(JSON.stringify({ ...logEntry, message: err.message, code: err.code }) + '\n');
    } else if (isDev) {
      console.error('[ApiError]', err.statusCode, err.code, err.message);
    }

    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        ...(err.field ? { field: err.field } : {}),
      },
    });
    return;
  }

  // Unknown errors
  const statusCode = 'status' in err && typeof err.status === 'number' ? err.status : 500;
  const message    = isDev ? (err as Error).message : 'Internal server error';

  if (!isDev) {
    process.stdout.write(
      JSON.stringify({ ...logEntry, message: (err as Error).message, stack: (err as Error).stack }) + '\n'
    );
  } else {
    console.error('[UnhandledError]', err);
  }

  res.status(statusCode).json({
    error: {
      message,
      code: 'INTERNAL_ERROR',
      ...(isDev ? { stack: (err as Error).stack } : {}),
    },
  });
};