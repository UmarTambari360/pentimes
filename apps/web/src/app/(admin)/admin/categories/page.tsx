import { getServerClient } from "@/lib/graphql/client";
import { GET_CATEGORIES } from "@/lib/graphql/queries/categories";
import { CategoriesManager } from "@/components/admin/categories-manager";
import type { CategoryType } from "@/types";

interface CategoriesResult {
  categories: CategoryType[];
}

export default async function AdminCategoriesPage() {
  let categories: CategoryType[] = [];

  try {
    const client = await getServerClient();
    const data = await client.request<CategoriesResult>(GET_CATEGORIES);
    categories = data.categories;
  } catch {}

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-serif text-headline-xl font-bold">Categories</h1>
        <p className="text-caption text-muted-foreground mt-1">
          Manage article categories
        </p>
      </div>
      <CategoriesManager categories={categories} />
    </div>
  );
}
