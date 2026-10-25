// apps/web/src/lib/seo.ts
//
// Shared SEO constants.
//
// WHY this exists:
//   Next.js does NOT merge nested metadata objects: a page that sets its own
//   `openGraph` replaces the layout's `openGraph` entirely, so a default image
//   set only in the root layout silently disappears on those pages. Pages that
//   define `openGraph` must reference this fallback themselves.

/** Fallback social-share card (1200×630) used when a page has no image of its own. */
export const DEFAULT_OG_IMAGE = {
  url: '/og-default.png',
  width: 1200,
  height: 630,
  alt: "Pen Times Magazine — Katsina's Voice",
};
