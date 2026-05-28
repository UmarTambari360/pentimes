import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getServerClient as getClient } from "@/lib/graphql/client";
import { GET_ARTICLE } from "@/lib/graphql/queries/articles";
import { GET_CATEGORIES } from "@/lib/graphql/queries/categories";
import { ArticleEditor } from "@/components/dashboard/article-editor";
import { cachedClient } from "@/lib/graphql/client";
import type { ArticleFullType, CategoryType } from "@/types";

interface ArticleResult {
  article: ArticleFullType | null;
}
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

  let article: ArticleFullType | null = null;
  let categories: CategoryType[] = [];

  try {
    const authClient = await getClient();
    // Fetch all articles to find by ID
    const articlesData = await authClient.request<{
      articles: { items: ArticleFullType[] };
    }>(
      `query GetArticleById($filters: ArticleFiltersInput) { articles(filters: $filters) { items { id title slug excerpt content coverImage status views readingTime publishedAt createdAt updatedAt author { id name avatar bio } categories { id name slug } likeCount commentCount isLiked isBookmarked } } }`,
      { filters: { authorId: user.id, limit: 100, offset: 0 } },
    );
    article = articlesData.articles.items.find((a) => a.id === id) ?? null;
  } catch {}

  if (!article) notFound();

  // Verify ownership (or admin)
  if (article.author.id !== user.id && user.role !== "admin")
    redirect("/dashboard/articles");

  try {
    const client = cachedClient(1800);
    const data = await client.request<CategoriesResult>(GET_CATEGORIES);
    categories = data.categories;
  } catch {}

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-headline-xl font-bold">Edit Article</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Update your article content and settings
        </p>
      </div>
      <ArticleEditor categories={categories} article={article} />
    </div>
  );
}
