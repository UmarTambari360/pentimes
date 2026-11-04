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

// ─── Safe fallbacks ───────────────────────────────────────────────────────
// SECURITY: graphql-request's ClientError.message is a JSON dump of the whole
// request, including the GraphQL *variables*. For login / change-password
// those variables contain plaintext passwords, so that message must NEVER be
// shown to a user or written to a log. Everything below maps errors to fixed,
// safe copy using only non-sensitive fields (HTTP status, error code).
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';
const UNAVAILABLE_MESSAGE =
  'We could not reach the service. Please try again shortly.';
const NETWORK_MESSAGE =
  'Cannot reach the server. Check your internet connection and try again.';

function hasObjectProp(value: unknown, key: string): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && key in value;
}

/** True when a plain Error message may be shown to a user as-is. */
function isSafeToShow(message: string): boolean {
  if (!message || message.length > 200) return false;
  // graphql-request dumps look like: GraphQL Error (Code: 404): {"response":...
  if (/^GraphQL Error \(Code:/i.test(message)) return false;
  if (message.includes('"request"') || message.includes('"variables"')) return false;
  if (message.trim().startsWith('{') || message.trim().startsWith('[')) return false;
  return true;
}

/** Maps an HTTP status from a non-GraphQL response (HTML 404, gateway error…). */
function fromHttpStatus(status: number): ParsedGraphQLError {
  if (status === 401) return { message: 'Please sign in to continue.', code: 'UNAUTHORIZED' };
  if (status === 403) return { message: 'You do not have permission to do that.', code: 'FORBIDDEN' };
  if (status === 429) return { message: 'You are doing that too quickly. Please wait a moment.', code: 'RATE_LIMITED' };
  if (status === 404 || status >= 500) {
    // 404 here means the API route itself was not found (misconfiguration),
    // not a missing article; users cannot fix it, so keep the copy neutral.
    return { message: UNAVAILABLE_MESSAGE, code: 'SERVICE_UNAVAILABLE' };
  }
  return { message: GENERIC_MESSAGE, code: 'UNKNOWN' };
}

// ─── Parse a thrown error from graphql-request ────────────────────────────
// graphql-request throws a ClientError that has a `response` with either an
// `errors` array (the API answered with GraphQL errors) or just an HTTP status
// (the request never reached a GraphQL server).
export function parseGraphQLError(err: unknown): ParsedGraphQLError {
  if (hasObjectProp(err, 'response') && err.response !== null && typeof err.response === 'object') {
    const response = err.response as {
      status?: unknown;
      errors?: Array<{ message: string; extensions?: GraphQLErrorExtension }>;
    };

    // 1. The API answered with structured GraphQL errors.
    if (Array.isArray(response.errors) && response.errors.length > 0 && response.errors[0]) {
      const first = response.errors[0];
      return {
        message: first.message ?? 'An unexpected error occurred.',
        code:    first.extensions?.code ?? 'UNKNOWN',
        field:   first.extensions?.field,
        details: first.extensions?.details,
      };
    }

    // 2. Only an HTTP status is available (HTML 404, 502 from the proxy…).
    //    Log the status only — never the request or its variables.
    if (typeof response.status === 'number') {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[api] request failed with HTTP status', response.status);
      }
      return fromHttpStatus(response.status);
    }
  }

  // Browser could not complete the request at all (DNS, CORS, offline).
  if (err instanceof TypeError) {
    return { message: NETWORK_MESSAGE, code: 'SERVICE_UNAVAILABLE' };
  }

  // Plain Error fallback — only when the message is clearly safe to show.
  if (err instanceof Error) {
    return isSafeToShow(err.message)
      ? { message: err.message, code: 'UNKNOWN' }
      : { message: GENERIC_MESSAGE, code: 'UNKNOWN' };
  }

  return { message: GENERIC_MESSAGE, code: 'UNKNOWN' };
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
      return parsed.message || GENERIC_MESSAGE;
  }
}

// ─── Convenience: parse + format in one call ──────────────────────────────
export function getErrorMessage(err: unknown): string {
  return toUserMessage(parseGraphQLError(err));
}