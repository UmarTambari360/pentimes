import type { MetadataRoute } from 'next';
import { cachedClient } from '@/lib/graphql/client';
import { GET_ARTICLES } from '@/lib/graphql/queries/articles';
import { GET_CATEGORIES } from '@/lib/graphql/queries/categories';
import type { ArticleCardType, CategoryType } from '@/types';

const SITE_URL =
  process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://pentimes.ng';

interface ArticlesResult {
  articles: { items: ArticleCardType[]; total: number };
}
interface CategoriesResult {
  categories: CategoryType[];
}

/**
 * Dynamic sitemap generation.
 *
 * Next.js calls this at build time (and on-demand with ISR). We fetch
 * all published articles and categories from the GraphQL API and return
 * them as sitemap entries.
 *
 * Caching: cachedClient(3600) means Next.js revalidates the sitemap
 * data every hour in production, keeping it fresh without hammering the DB.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages — always present
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
      changeFrequency: 'daily',
      priority: 0.5,
    },
  ];

  try {
    const client = cachedClient(3600); // 1-hour cache for sitemap requests

    // Fetch articles in batches (sitemap limit is 50,000 URLs per file)
    // For most news sites, a single batch of 500 is sufficient initially.
    const [articlesData, categoriesData] = await Promise.allSettled([
      client.request<ArticlesResult>(GET_ARTICLES, {
        filters: { status: 'published', limit: 500, offset: 0 },
      }),
      client.request<CategoriesResult>(GET_CATEGORIES),
    ]);

    const articleRoutes: MetadataRoute.Sitemap =
      articlesData.status === 'fulfilled'
        ? articlesData.value.articles.items.map((article) => ({
            url: `${SITE_URL}/articles/${article.slug}`,
            lastModified: article.publishedAt
              ? new Date(article.publishedAt)
              : new Date(article.createdAt),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          }))
        : [];

    const categoryRoutes: MetadataRoute.Sitemap =
      categoriesData.status === 'fulfilled'
        ? categoriesData.value.categories.map((cat) => ({
            url: `${SITE_URL}/category/${cat.slug}`,
            lastModified: new Date(cat.createdAt),
            changeFrequency: 'daily' as const,
            priority: 0.7,
          }))
        : [];

    return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
  } catch {
    // If the API is unavailable at build time, return static routes only
    return staticRoutes;
  }
}