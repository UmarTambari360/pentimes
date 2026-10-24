// apps/web/src/lib/api-url.ts
//
// WHY this file exists:
//   API base URLs come from env vars (NEXT_PUBLIC_API_URL, INTERNAL_API_URL)
//   and are joined as `${API_URL}/graphql`, `${API_URL}/upload/...`. A trailing
//   slash in the env value (e.g. "https://api.example.app/") produced
//   "//graphql", which some proxies and strict servers reject or rewrite.
//   Normalizing in one place makes every call site tolerant of either form.
//
//   Pure string logic with no Node/Next imports, so it is safe in the browser,
//   Server Components and the Edge middleware alike.

/** Trims whitespace and removes any trailing slashes: "https://x.app/ " → "https://x.app". */
export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}
