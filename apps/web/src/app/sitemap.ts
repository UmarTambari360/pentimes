import type { MetadataRoute } from 'next';
import { GraphQLClient } from 'graphql-request';

/**
 * Dynamic sitemap for Pen Times Magazine.
 *
 * WHY a sitemap matters for a regional news site:
 * Google needs to discover article URLs quickly. A Nigerian regional outlet
 * competes with larger publishers, so every crawl-budget optimisation counts.
 * This sitemap gives Google priority signals and last-modified hints so new
 * articles are indexed within hours, not days.
 *
 * Architecture note:
 * We call the GraphQL API directly here (server-side, at build/revalidation
 * time). We do NOT hit the DB directly — that would violate the separation of
 * concerns between web and api apps.
 */

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://pentimes.ng';

const GET_SITEMAP_ARTICLES = `
  query GetSitemapArticles($filters: ArticleFiltersInput) {
    articles(filters: $filters) {
      items {
        slug
        updatedAt
        publishedAt
      }
      total
    }
  }
`;

const GET_SITEMAP_CATEGORIES = `
  query GetSitemapCategories {
    categories {
      slug
    }
  }
`;

interface SitemapArticle {
  slug: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface SitemapCategory {
  slug: string;
}

async function fetchSitemapData() {
  const client = new GraphQLClient(`${API_URL}/graphql`, {
    // Revalidate every hour in production — articles publish frequently
    next: { revalidate: 3600 },
  } as never);

  try {
    const [articlesData, categoriesData] = await Promise.allSettled([
      client.request<{ articles: { items: SitemapArticle[]; total: number } }>(
        GET_SITEMAP_ARTICLES,
        { filters: { status: 'published', limit: 1000, offset: 0 } }
      ),
      client.request<{ categories: SitemapCategory[] }>(GET_SITEMAP_CATEGORIES),
    ]);

    const articles =
      articlesData.status === 'fulfilled'
        ? articlesData.value.articles.items
        : [];

    const categories =
      categoriesData.status === 'fulfilled'
        ? categoriesData.value.categories
        : [];

    return { articles, categories };
  } catch {
    // Sitemap generation should never break the build
    return { articles: [], categories: [] };
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { articles, categories } = await fetchSitemapData();

  // ── Static routes ─────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/programs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // ── Article routes ─────────────────────────────────────────────
  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/articles/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: 'weekly' as const,
    // Published articles get higher priority than stale ones
    priority: 0.8,
  }));

  // ── Category routes ────────────────────────────────────────────
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...articleRoutes, ...categoryRoutes];
}