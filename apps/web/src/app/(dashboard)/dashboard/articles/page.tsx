import { getServerClient } from "@/lib/graphql/client";
import { getCurrentUser } from "@/lib/auth/session";
import { GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { ArticlesTable } from "@/components/dashboard/articles-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PenSquare } from "lucide-react";
import type { ArticleCardType } from "@/types";

interface ArticlesResult {
  articles: { items: ArticleCardType[]; total: number };
}

export default async function DashboardArticlesPage() {
  const user = await getCurrentUser();

  let articles: ArticleCardType[] = [];
  let total = 0;

  try {
    const client = await getServerClient();
    const data = await client.request<ArticlesResult>(GET_ARTICLES, {
      filters: { authorId: user?.id, limit: 50, offset: 0 },
    });
    articles = data.articles.items;
    total = data.articles.total;
  } catch {}

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-headline-xl font-bold">My Articles</h1>
          <p className="text-caption text-muted-foreground mt-1">
            {total} total article{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="amber" asChild className="gap-2">
          <Link href="/dashboard/articles/new">
            <PenSquare className="h-4 w-4" />
            New Article
          </Link>
        </Button>
      </div>

      <ArticlesTable articles={articles} userRole={user?.role ?? "reader"} />
    </div>
  );
}
