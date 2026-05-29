import type { MetadataRoute } from 'next';

/**
 * Robots.txt for Pen Times Magazine.
 *
 * Rules:
 * - All public content is crawlable (this is a news site — we WANT indexing)
 * - Block dashboard, admin, and API routes from bots
 * - Block auth pages (no SEO value, and Google wastes crawl budget on login forms)
 * - Point to the sitemap so Google finds it without needing to scan
 */

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://pentimes.ng';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/articles/',
          '/category/',
          '/programs',
          '/search',
          '/about',
          '/contact',
        ],
        disallow: [
          '/dashboard/',
          '/admin/',
          '/login',
          '/register',
          '/api/',
          '/_next/',
          '/static/',
        ],
      },
      // Be extra polite to Google News crawler — it respects these settings
      {
        userAgent: 'Googlebot-News',
        allow: ['/articles/'],
        disallow: ['/dashboard/', '/admin/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}