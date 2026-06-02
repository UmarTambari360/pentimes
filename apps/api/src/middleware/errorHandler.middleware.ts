// apps/api/src/middleware/errorHandler.middleware.ts
//
// WHY a custom ApiError class:
//   Express's default error handler returns HTML, which breaks any client
//   that expects JSON.  By encoding statusCode, errorCode, and an optional
//   field reference into the error itself we can construct a consistent
//   machine-readable response at a single point, rather than sprinkling
//   res.status(400).json({...}) calls throughout every route handler.
//
// WHY not expose stack traces in production:
//   Stack traces leak file paths, dependency names, and internal logic to
//   anyone who can trigger a 500.  We log them server-side but scrub them
//   from the HTTP response.

import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { isDev } from '../config/env.js';
import { logger } from '../helpers/logger.js';

// ─── Canonical error codes ─────────────────────────────────────────────────
// These string codes let clients branch on error type without parsing message
// strings, which break when wording changes.
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface SerializedError {
  message: string;
  code: ErrorCode;
  field?: string;
  details?: Record<string, string[]>;
  stack?: string; // only present in development
}

// ─── ApiError ──────────────────────────────────────────────────────────────
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly field?: string | undefined;
  public readonly details?: Record<string, string[]> | undefined;

  constructor(
    message: string,
    statusCode = 500,
    code: ErrorCode = 'INTERNAL_ERROR',
    field?: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    this.details = details;

    // Maintain proper prototype chain for instanceof checks.
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // ── Factory methods ───────────────────────────────────────────────────────

  static badRequest(message: string, field?: string): ApiError {
    return new ApiError(message, 400, 'BAD_REQUEST', field);
  }

  static validation(details: Record<string, string[]>): ApiError {
    return new ApiError(
      'Validation failed. Please check the highlighted fields.',
      422,
      'VALIDATION_ERROR',
      undefined,
      details,
    );
  }

  static unauthorized(message = 'Authentication required.'): ApiError {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to perform this action.'): ApiError {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource: string): ApiError {
    return new ApiError(`${resource} not found.`, 404, 'NOT_FOUND');
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409, 'CONFLICT');
  }

  static rateLimited(message = 'Too many requests. Please slow down.'): ApiError {
    return new ApiError(message, 429, 'RATE_LIMITED');
  }

  static internal(message = 'An unexpected error occurred. Please try again later.'): ApiError {
    return new ApiError(message, 500, 'INTERNAL_ERROR');
  }

  static serviceUnavailable(service: string): ApiError {
    return new ApiError(
      `${service} is temporarily unavailable. Please try again in a moment.`,
      503,
      'SERVICE_UNAVAILABLE',
    );
  }

  // Serialise for the HTTP response body.
  toJSON(): SerializedError {
    const body: SerializedError = {
      message: this.message,
      code: this.code,
    };
    if (this.field) body.field = this.field;
    if (this.details) body.details = this.details;
    if (isDev && this.stack) body.stack = this.stack;
    return body;
  }
}

// ─── Zod → ApiError converter ─────────────────────────────────────────────
// WHY: Zod errors have a structured format. We translate them into our
// canonical ApiError.validation shape so callers always see the same shape.
export function fromZodError(error: ZodError): ApiError {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!details[path]) details[path] = [];
    details[path].push(issue.message);
  }
  return ApiError.validation(details);
}

// ─── Express error handler ────────────────────────────────────────────────
// This MUST be registered last in the Express middleware chain (after all
// routes) and MUST have four parameters — Express detects error handlers by
// arity, not by name.
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // ── Known ApiError ──────────────────────────────────────────────────────
  if (err instanceof ApiError) {
    // Only log 5xx as errors; 4xx are expected operational events.
    if (err.statusCode >= 500) {
      logger.error('ApiError 5xx', {
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
        stack: err.stack,
      });
    } else {
      logger.warn('ApiError 4xx', {
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
      });
    }

    res.status(err.statusCode).json({ error: err.toJSON() });
    return;
  }

  // ── Zod validation error (thrown outside resolvers) ─────────────────────
  if (err instanceof ZodError) {
    const apiErr = fromZodError(err);
    logger.warn('ZodError', { path: req.path, details: apiErr.details });
    res.status(422).json({ error: apiErr.toJSON() });
    return;
  }

  // ── Unknown / unexpected error ──────────────────────────────────────────
  const message = err instanceof Error ? err.message : 'Unknown error';
  const stack   = err instanceof Error ? err.stack   : undefined;

  logger.error('Unhandled error', {
    message,
    path: req.path,
    method: req.method,
    stack,
  });

  res.status(500).json({
    error: {
      message: isDev ? message : 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_ERROR' as ErrorCode,
      ...(isDev && stack ? { stack } : {}),
    } satisfies SerializedError,
  });
};