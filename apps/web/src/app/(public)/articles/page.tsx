import type { Metadata } from 'next';
import Link from 'next/link';
import { cachedClient } from '@/lib/graphql/client';
import { GET_ARTICLES } from '@/lib/graphql/queries/articles';
import { GET_CATEGORIES } from '@/lib/graphql/queries/categories';
import { ArticleCard } from '@/components/ui/article-card';
import { CategoryBadge } from '@/components/ui/category-badge';
import { Pagination } from '@/components/public/pagination';
import type { ArticleCardType, CategoryType } from '@/types';

export const metadata: Metadata = {
  title: 'All Articles',
  description: 'Browse all articles from Pen Times Magazine',
};

interface ArticlesResult { articles: { items: ArticleCardType[]; total: number } }
interface CategoriesResult { categories: CategoryType[] }

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string; category?: string }>;
}) {
  const { offset: offsetStr, category } = await searchParams;
  const offset = Number(offsetStr ?? 0);
  const limit  = 12;

  const client = cachedClient(300);

  const [articlesData, categoriesData] = await Promise.allSettled([
    client.request<ArticlesResult>(GET_ARTICLES, {
      filters: {
        status: 'published',
        categorySlug: category ?? undefined,
        limit,
        offset,
      },
    }),
    client.request<CategoriesResult>(GET_CATEGORIES),
  ]);

  const articles = articlesData.status === 'fulfilled'
    ? articlesData.value.articles
    : { items: [], total: 0 };

  const categories = categoriesData.status === 'fulfilled'
    ? categoriesData.value.categories
    : [];

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 pb-4 border-b-2 border-foreground">
        <h1 className="font-serif text-display font-bold">All Stories</h1>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/articles"
            className={`text-overline font-semibold uppercase tracking-widest px-3 py-1.5 rounded-sm transition-colors ${
              !category
                ? 'bg-ink-900 text-white'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/articles?category=${cat.slug}`}
              className={`text-overline font-semibold uppercase tracking-widest px-3 py-1.5 rounded-sm transition-colors ${
                category === cat.slug
                  ? 'bg-amber-500 text-ink-900'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {articles.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {articles.items.map((article) => (
              <ArticleCard key={article.id} article={article} variant="vertical" />
            ))}
          </div>
          <Pagination total={articles.total} limit={limit} offset={offset} />
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-body text-muted-foreground">No articles found.</p>
        </div>
      )}
    </div>
  );
}