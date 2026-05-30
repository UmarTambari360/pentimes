import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getServerClient } from "@/lib/graphql/client";
import { cachedClient } from "@/lib/graphql/client";
import { GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { GET_CATEGORIES } from "@/lib/graphql/queries/categories";
import { ArticleEditor } from "@/components/dashboard/article-editor";
import { Edit } from "lucide-react";
import type { ArticleFullType, CategoryType } from "@/types";

interface CategoriesResult {
  categories: CategoryType[];
}

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "reader") redirect("/dashboard");

  let article: ArticleFullType | null = null;
  let categories: CategoryType[] = [];

  try {
    const authClient = await getServerClient();

    // Fetch all author articles to find by ID
    // (The API filters by author unless admin)
    const articlesData = await authClient.request<{
      articles: { items: ArticleFullType[] };
    }>(
      `query GetArticleById($filters: ArticleFiltersInput) {
        articles(filters: $filters) {
          items {
            id title slug excerpt content coverImage status
            views readingTime publishedAt createdAt updatedAt
            author { id name avatar bio }
            categories { id name slug }
            likeCount commentCount isLiked isBookmarked
          }
        }
      }`,
      {
        filters: {
          authorId: user.role === "admin" ? undefined : user.id,
          limit: 200,
          offset: 0,
        },
      },
    );

    article = articlesData.articles.items.find((a) => a.id === id) ?? null;
  } catch {}

  if (!article) notFound();

  // Verify ownership or admin
  if (article.author.id !== user.id && user.role !== "admin") {
    redirect("/dashboard/articles");
  }

  try {
    const client = cachedClient(1800);
    const data = await client.request<CategoriesResult>(GET_CATEGORIES);
    categories = data.categories;
  } catch {}

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Edit className="h-5 w-5 text-amber-500" />
          <h1 className="font-serif text-headline-xl font-bold">
            Edit Article
          </h1>
        </div>
        <p className="text-body-sm text-muted-foreground">
          Update your article content and settings. Changes are saved
          immediately on submit.
        </p>
      </div>
      <ArticleEditor categories={categories} article={article} />
    </div>
  );
}
