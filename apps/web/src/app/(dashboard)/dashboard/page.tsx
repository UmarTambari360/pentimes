import { getCurrentUser } from "@/lib/auth/session";
import { getServerClient } from "@/lib/graphql/client";
import { GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { StatCard } from "@/components/ui/stat-card";
import { ArticleCard } from "@/components/ui/article-card";
import { SectionHeader } from "@/components/public/section-header";
import { FileText, Bookmark, MessageSquare, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ArticleCardType } from "@/types";

interface ArticlesResult {
  articles: { items: ArticleCardType[]; total: number };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  let myArticles: ArticleCardType[] = [];
  let totalViews = 0;

  try {
    const client = await getServerClient();
    const data = await client.request<ArticlesResult>(GET_ARTICLES, {
      filters: { authorId: user?.id, limit: 6, offset: 0 },
    });
    myArticles = data.articles.items;
    totalViews = myArticles.reduce((sum, a) => sum + a.views, 0);
  } catch {}

  const publishedCount = myArticles.filter(
    (a) => a.status === "published",
  ).length;
  const draftCount = myArticles.filter((a) => a.status === "draft").length;

  return (
    <div className="p-6 max-w-5xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-serif text-headline-xl font-bold">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Here&apos;s an overview of your content and activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Published"
          value={publishedCount}
          icon={FileText}
          variant="success"
        />
        <StatCard label="Drafts" value={draftCount} icon={FileText} />
        <StatCard
          label="Total Views"
          value={totalViews}
          icon={Eye}
          variant="info"
        />
        <StatCard
          label="Articles"
          value={myArticles.length}
          icon={Bookmark}
          variant="amber"
        />
      </div>

      {/* Recent articles */}
      {myArticles.length > 0 ? (
        <section>
          <SectionHeader
            title="My Recent Articles"
            href="/dashboard/articles"
            hrefLabel="View all"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myArticles.slice(0, 4).map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="horizontal"
                showStatus
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-serif font-semibold text-body mb-2">
            No articles yet
          </h3>
          <p className="text-body-sm text-muted-foreground mb-4">
            Share your stories with Katsina and beyond
          </p>
          <Button variant="amber" asChild>
            <Link href="/dashboard/articles/new">Write your first article</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
