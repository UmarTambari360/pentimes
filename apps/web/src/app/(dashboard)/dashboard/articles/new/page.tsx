import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { cachedClient } from "@/lib/graphql/client";
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
  try {
    const client = cachedClient(1800);
    const data = await client.request<CategoriesResult>(GET_CATEGORIES);
    categories = data.categories;
  } catch {}

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
      <ArticleEditor categories={categories} />
    </div>
  );
}
