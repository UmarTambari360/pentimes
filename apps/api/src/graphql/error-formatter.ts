// WHY a custom GraphQL error formatter:
//   GraphQL Yoga's default formatter exposes full stack traces and internal
//   Pothos error metadata in production responses.  We intercept every error
//   before it leaves the server so we can:
//     1. Scrub stacks and sensitive internals in production.
//     2. Map our ApiError codes into GraphQL extensions so clients can
//        branch on `error.extensions.code` — the GraphQL convention.
//     3. Log server-side errors with full context (stack, userId, operationName).
//   The formatter receives the ORIGINAL error (not the masked one), which is
//   important — we want full info for logging even when we return a vague
//   "Internal error" to the client.

import { GraphQLError, type GraphQLFormattedError } from 'graphql';
import { isDev } from '../config/env.js';
import { logger } from '../helpers/logger.js';
import { ApiError } from '../middleware/errorHandler.middleware.js';

// The shape of what we add to error.extensions in every formatted error.
export interface GraphQLErrorExtensions {
  code: string | 'GRAPHQL_VALIDATION_FAILED' | 'GRAPHQL_PARSE_FAILED' | 'UNKNOWN';
  field?: string;
  details?: Record<string, string[]>;
  timestamp: string;
  // Only included in development.
  stacktrace?: string[];
  // Allow other unknown extension properties to satisfy GraphQLFormattedError
  [key: string]: unknown;
}

export interface FormattedGraphQLError extends GraphQLFormattedError {
  extensions: GraphQLErrorExtensions;
}

// ─── Map well-known GraphQL error codes 
function getExtensionCode(err: GraphQLError): GraphQLErrorExtensions['code'] {
  // Pothos scope-auth surfaces its errors via extensions.code already.
  const existing = err.extensions?.['code'];
  if (typeof existing === 'string') return existing as GraphQLErrorExtensions['code'];

  // Introspection / parse errors come through as GraphQLError with no
  // originalError and a specific path/message pattern.
  if (err.message.startsWith('Syntax Error')) return 'GRAPHQL_PARSE_FAILED';

  return 'UNKNOWN';
}

// ─── Main formatter
export function formatError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): FormattedGraphQLError {
  const timestamp = new Date().toISOString();

  // Unwrap GraphQLError → original cause.
  const originalError =
    error instanceof GraphQLError ? (error.originalError ?? error) : error;

  // ── ApiError — rich, intentional error we raised ourselves ──────────────
  if (originalError instanceof ApiError) {
    // 4xx: expected, warn level. 5xx: unexpected, error level.
    if (originalError.statusCode >= 500) {
      logger.error('GraphQL ApiError 5xx', {
        message: originalError.message,
        code: originalError.code,
        stack: originalError.stack,
      });
    } else {
      logger.warn('GraphQL ApiError 4xx', {
        message: originalError.message,
        code: originalError.code,
        field: originalError.field,
      });
    }

    const extensions: GraphQLErrorExtensions = {
      code: originalError.code,
      timestamp,
    };
    if (originalError.field)   extensions.field   = originalError.field;
    if (originalError.details) extensions.details = originalError.details;
    if (isDev && originalError.stack) {
      extensions.stacktrace = originalError.stack.split('\n').map((l) => l.trim());
    }

    return {
      message: originalError.message,
      locations: formattedError.locations ?? [],
      path: formattedError.path ?? [],
      extensions,
    };
  }

  // ── Generic GraphQLError (auth, validation, parse)
  if (error instanceof GraphQLError) {
    const code = getExtensionCode(error);

    // Only log if it is not a client-side validation issue.
    if (code === 'UNKNOWN') {
      logger.warn('GraphQL error', { message: error.message, code });
    }

    const extensions: GraphQLErrorExtensions = { code, timestamp };
    if (isDev && error.stack) {
      extensions.stacktrace = error.stack.split('\n').map((l) => l.trim());
    }

    return {
      message: formattedError.message,
      locations: formattedError.locations ?? [],
      path: formattedError.path ?? [],
      extensions,
    };
  }

  // ── Completely unexpected / unhandled error
  const unknownMessage = originalError instanceof Error
    ? originalError.message
    : 'An unexpected error occurred.';
  const stack = originalError instanceof Error ? originalError.stack : undefined;

  logger.error('Unhandled GraphQL error', { message: unknownMessage, stack });

  const extensions: GraphQLErrorExtensions = { code: 'UNKNOWN', timestamp };
  if (isDev && stack) {
    extensions.stacktrace = stack.split('\n').map((l) => l.trim());
  }

  return {
    // Never expose raw unknown messages in production.
    message: isDev
      ? unknownMessage
      : 'An unexpected error occurred. Please try again later.',
    locations: formattedError.locations ?? [],
    path: formattedError.path ?? [],
    extensions,
  };
}