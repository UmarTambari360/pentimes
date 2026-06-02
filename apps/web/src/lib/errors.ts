// apps/web/src/lib/errors.ts
//
// WHY centralised error parsing:
//   GraphQL errors arrive as an array on the thrown ClientError from
//   graphql-request.  Every mutation handler would otherwise need to
//   repeat the same extraction logic.  This module provides one place
//   to map error shapes into user-friendly strings, and one place to
//   update when the API error format changes.

export interface GraphQLErrorExtension {
  code?: string;
  field?: string;
  details?: Record<string, string[]>;
  timestamp?: string;
}

export interface ParsedGraphQLError {
  message: string;
  code: string;
  field?: string;
  details?: Record<string, string[]>;
}

// ─── Parse a thrown error from graphql-request ────────────────────────────
// graphql-request throws a ClientError that has a `response.errors` array.
export function parseGraphQLError(err: unknown): ParsedGraphQLError {
  // graphql-request ClientError shape.
  if (
    err !== null &&
    typeof err === 'object' &&
    'response' in err &&
    err.response !== null &&
    typeof err.response === 'object' &&
    'errors' in err.response &&
    Array.isArray((err.response as { errors?: unknown[] }).errors)
  ) {
    const errors = (err.response as { errors: Array<{
      message: string;
      extensions?: GraphQLErrorExtension;
    }> }).errors;

    if (errors.length > 0 && errors[0]) {
      const first = errors[0];
      return {
        message:  first.message ?? 'An unexpected error occurred.',
        code:     first.extensions?.code ?? 'UNKNOWN',
        field:    first.extensions?.field,
        details:  first.extensions?.details,
      };
    }
  }

  // Plain Error fallback.
  if (err instanceof Error) {
    // graphql-request sometimes wraps the message with "GraphQL Error: ".
    const message = err.message.replace(/^GraphQL(?:\s+request)?(?:\s+error)?:\s*/i, '');
    return { message, code: 'UNKNOWN' };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN',
  };
}

// ─── Convert details map to a flat human-readable string ──────────────────
export function detailsToString(details: Record<string, string[]>): string {
  return Object.entries(details)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('; ');
}

// ─── User-facing message resolver ─────────────────────────────────────────
// Maps machine error codes to copy that makes sense to a reader/author/admin
// on a Nigerian digital news platform.
export function toUserMessage(parsed: ParsedGraphQLError): string {
  switch (parsed.code) {
    case 'UNAUTHORIZED':
      return 'Please sign in to continue.';
    case 'FORBIDDEN':
      return 'You do not have permission to do that.';
    case 'NOT_FOUND':
      return parsed.message; // These are already human-readable ("Article not found.").
    case 'CONFLICT':
      return parsed.message; // e.g., "Email already in use."
    case 'VALIDATION_ERROR':
      if (parsed.details) return detailsToString(parsed.details);
      return parsed.message;
    case 'RATE_LIMITED':
      return 'You are doing that too quickly. Please wait a moment.';
    case 'SERVICE_UNAVAILABLE':
      return 'Service is temporarily unavailable. Please try again shortly.';
    case 'INTERNAL_ERROR':
    case 'UNKNOWN':
    default:
      return parsed.message || 'Something went wrong. Please try again.';
  }
}

// ─── Convenience: parse + format in one call ──────────────────────────────
export function getErrorMessage(err: unknown): string {
  return toUserMessage(parseGraphQLError(err));
}