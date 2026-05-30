import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { cachedClient } from "@/lib/graphql/client";
import { GET_CATEGORIES } from "@/lib/graphql/queries/categories";
import { ArticleEditor } from "@/components/dashboard/article-editor";
import { PenSquare } from "lucide-react";
import type { CategoryType } from "@/types";

interface CategoriesResult {
  categories: CategoryType[];
}

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "reader") redirect("/dashboard");

  let categories: CategoryType[] = [];
  try {
    const client = cachedClient(1800);
    const data = await client.request<CategoriesResult>(GET_CATEGORIES);
    categories = data.categories;
  } catch {}

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <PenSquare className="h-5 w-5 text-amber-500" />
          <h1 className="font-serif text-headline-xl font-bold">
            Write New Article
          </h1>
        </div>
        <p className="text-body-sm text-muted-foreground">
          Share your story with Pen Times readers. Fill in all required fields
          before publishing.
        </p>
      </div>

      {categories.length === 0 && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <p className="text-body-sm text-amber-800 dark:text-amber-300">
            <strong>Note:</strong> No categories are available yet. An admin
            must create categories before you can publish articles.
          </p>
        </div>
      )}

      <ArticleEditor categories={categories} />
    </div>
  );
}
