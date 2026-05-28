import { getServerClient } from "@/lib/graphql/client";
import { GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { GET_CATEGORIES } from "@/lib/graphql/queries/categories";
import { ArticlesTable } from "@/components/dashboard/articles-table";
import type { ArticleCardType, CategoryType } from "@/types";

interface ArticlesResult {
  articles: { items: ArticleCardType[]; total: number };
}
interface CategoriesResult {
  categories: CategoryType[];
}

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const { category, status } = await searchParams;

  let articles: ArticleCardType[] = [];

  try {
    const client = await getServerClient();
    const data = await client.request<ArticlesResult>(GET_ARTICLES, {
      filters: {
        categorySlug: category ?? undefined,
        status: (status as "draft" | "published" | undefined) ?? undefined,
        limit: 100,
        offset: 0,
      },
    });
    articles = data.articles.items;
  } catch {}

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-serif text-headline-xl font-bold">All Articles</h1>
        <p className="text-caption text-muted-foreground mt-1">
          {articles.length} articles across all authors
        </p>
      </div>

      <ArticlesTable articles={articles} userRole="admin" />
    </div>
  );
}
