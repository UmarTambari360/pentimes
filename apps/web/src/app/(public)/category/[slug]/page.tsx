import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cachedClient } from "@/lib/graphql/client";
import { GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { GET_CATEGORY } from "@/lib/graphql/queries/categories";
import { ArticleCard } from "@/components/ui/article-card";
import { Pagination } from "@/components/public/pagination";
import type { ArticleCardType, CategoryType } from "@/types";

interface ArticlesResult {
  articles: { items: ArticleCardType[]; total: number };
}
interface CategoryResult {
  category: CategoryType | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const client = cachedClient(1800);

  try {
    const data = await client.request<CategoryResult>(GET_CATEGORY, { slug });
    const cat = data.category;
    if (!cat) return {};
    return {
      title: `${cat.name} — Pen Times Magazine`,
      description:
        cat.description ?? `Latest ${cat.name} news from Pen Times Magazine`,
    };
  } catch {
    return {};
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ offset?: string }>;
}) {
  const { slug } = await params;
  const { offset: offsetStr } = await searchParams;
  const offset = Number(offsetStr ?? 0);
  const limit = 12;

  const client = cachedClient(300);

  const [categoryData, articlesData] = await Promise.allSettled([
    client.request<CategoryResult>(GET_CATEGORY, { slug }),
    client.request<ArticlesResult>(GET_ARTICLES, {
      filters: { status: "published", categorySlug: slug, limit, offset },
    }),
  ]);

  const category =
    categoryData.status === "fulfilled" ? categoryData.value.category : null;
  if (!category) notFound();

  const articles =
    articlesData.status === "fulfilled"
      ? articlesData.value.articles
      : { items: [], total: 0 };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8">
      {/* Category header */}
      <div className="mb-8 pb-6 border-b-2 border-foreground">
        <p className="text-overline font-semibold uppercase tracking-widest text-amber-600 mb-2">
          Section
        </p>
        <h1 className="font-serif text-display font-bold text-foreground mb-2">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-body-lg text-muted-foreground max-w-prose">
            {category.description}
          </p>
        )}
        <p className="text-caption text-muted-foreground mt-3">
          {articles.total.toLocaleString()}{" "}
          {articles.total === 1 ? "article" : "articles"}
        </p>
      </div>

      {/* Articles grid */}
      {articles.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {articles.items.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="vertical"
              />
            ))}
          </div>
          <Pagination total={articles.total} limit={limit} offset={offset} />
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-body text-muted-foreground">
            No articles in this category yet.
          </p>
        </div>
      )}
    </div>
  );
}
