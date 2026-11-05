import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { publicClient } from "@/lib/graphql/client";
import { GET_CATEGORIES } from "@/lib/graphql/queries/categories";
import { ArticleEditor } from "@/components/dashboard/article-editor";
import type { CategoryType } from "@/types";

interface CategoriesResult {
  categories: CategoryType[];
}

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "author" && user.role !== "admin")) {
    redirect("/dashboard");
  }

  let categories: CategoryType[] = [];
  let categoriesLoadFailed = false;
  try {
    const data = await publicClient.request<CategoriesResult>(GET_CATEGORIES);
    categories = data.categories;
  } catch {
    categoriesLoadFailed = true;
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-headline-xl font-bold">
          Write New Article
        </h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Share your story with Pen Times readers
        </p>
      </div>
      {categoriesLoadFailed ? (
        <div role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-body-sm text-destructive">
            Categories could not be loaded. Refresh the page or contact an admin if the problem continues.
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-body-sm text-amber-800 dark:text-amber-300">
            <strong>Note:</strong> No categories are available yet. Ask an admin to create one before publishing.
          </p>
        </div>
      ) : null}

      <ArticleEditor categories={categories} />
    </div>
  );
}
