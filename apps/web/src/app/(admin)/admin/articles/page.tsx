import { getServerClient } from "@/lib/graphql/client";
import { GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { GET_CATEGORIES } from "@/lib/graphql/queries/categories";
import { AdminArticlesTable } from "@/components/admin/admin-articles-table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
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
  let total = 0;
  let categories: CategoryType[] = [];

  try {
    const client = await getServerClient();
    const [articlesData, categoriesData] = await Promise.allSettled([
      client.request<ArticlesResult>(GET_ARTICLES, {
        filters: {
          categorySlug: category ?? undefined,
          status: (status as "draft" | "published" | undefined) ?? undefined,
          limit: 100,
          offset: 0,
        },
      }),
      client.request<CategoriesResult>(GET_CATEGORIES),
    ]);

    if (articlesData.status === "fulfilled") {
      articles = articlesData.value.articles.items;
      total = articlesData.value.articles.total;
    }
    if (categoriesData.status === "fulfilled") {
      categories = categoriesData.value.categories;
    }
  } catch {}

  const statuses = [
    { label: "All", value: undefined },
    { label: "Published", value: "published" },
    { label: "Draft", value: "draft" },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="font-serif text-headline-xl font-bold">All Articles</h1>
        <p className="text-caption text-muted-foreground mt-1">
          {total} articles across all authors
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Status filters */}
        <div className="flex gap-2 items-center">
          <span className="text-caption text-muted-foreground">Status:</span>
          {statuses.map((s) => {
            const isActive =
              (s.value === undefined && !status) || s.value === status;
            const href = s.value
              ? `/admin/articles?status=${s.value}${category ? `&category=${category}` : ""}`
              : `/admin/articles${category ? `?category=${category}` : ""}`;
            return (
              <Link key={s.label} href={href}>
                <Badge variant={isActive ? "amber" : "default"}>
                  {s.label}
                </Badge>
              </Link>
            );
          })}
        </div>

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-caption text-muted-foreground">
              Category:
            </span>
            <Link href={`/admin/articles${status ? `?status=${status}` : ""}`}>
              <Badge variant={!category ? "amber" : "default"}>All</Badge>
            </Link>
            {categories.map((cat) => {
              const isActive = cat.slug === category;
              const href = `/admin/articles?category=${cat.slug}${status ? `&status=${status}` : ""}`;
              return (
                <Link key={cat.id} href={href}>
                  <Badge variant={isActive ? "amber" : "default"}>
                    {cat.name}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <AdminArticlesTable articles={articles} />
    </div>
  );
}
