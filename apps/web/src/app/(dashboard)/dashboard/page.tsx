import { getCurrentUser } from "@/lib/auth/session";
import { getServerClient } from "@/lib/graphql/client";
import { GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { GET_MY_COMMENTS } from "@/lib/graphql/queries/comments";
import { GET_MY_BOOKMARKS } from "@/lib/graphql/queries/articles";
import { StatCard } from "@/components/ui/stat-card";
import { ArticleCard } from "@/components/ui/article-card";
import { SectionHeader } from "@/components/public/section-header";
import {
  FileText,
  Bookmark,
  MessageSquare,
  Eye,
  PenSquare,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/utils";
import type { ArticleCardType } from "@/types";

interface ArticlesResult {
  articles: { items: ArticleCardType[]; total: number };
}
interface CommentsResult {
  myComments: Array<{
    id: string;
    body: string;
    articleId: string;
    createdAt: string;
  }>;
}
interface BookmarksResult {
  myBookmarks: ArticleCardType[];
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  let myArticles: ArticleCardType[] = [];
  let allArticlesTotal = 0;
  let commentCount = 0;
  let bookmarkCount = 0;

  try {
    const client = await getServerClient();

    const [articlesData, commentsData, bookmarksData] =
      await Promise.allSettled([
        client.request<ArticlesResult>(GET_ARTICLES, {
          filters: { authorId: user?.id, limit: 50, offset: 0 },
        }),
        client.request<CommentsResult>(GET_MY_COMMENTS),
        client.request<BookmarksResult>(GET_MY_BOOKMARKS, {
          limit: 50,
          offset: 0,
        }),
      ]);

    if (articlesData.status === "fulfilled") {
      myArticles = articlesData.value.articles.items;
      allArticlesTotal = articlesData.value.articles.total;
    }
    if (commentsData.status === "fulfilled") {
      commentCount = commentsData.value.myComments.length;
    }
    if (bookmarksData.status === "fulfilled") {
      bookmarkCount = bookmarksData.value.myBookmarks.length;
    }
  } catch {}

  const publishedArticles = myArticles.filter((a) => a.status === "published");
  const draftArticles = myArticles.filter((a) => a.status === "draft");
  const totalViews = myArticles.reduce((sum, a) => sum + a.views, 0);
  const totalLikes = myArticles.reduce((sum, a) => sum + a.likeCount, 0);

  const recentArticles = myArticles.slice(0, 4);
  const canWrite = user?.role === "author" || user?.role === "admin";

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 max-w-5xl">
      {/* Page header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-caption text-muted-foreground mb-1">
            {greeting()},
          </p>
          <h1 className="font-serif text-headline-xl font-bold">
            {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Here&apos;s an overview of your content and activity.
          </p>
        </div>
        {canWrite && (
          <Button variant="amber" asChild className="gap-2 shrink-0">
            <Link href="/dashboard/articles/new">
              <PenSquare className="h-4 w-4" />
              Write Article
            </Link>
          </Button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Published"
          value={publishedArticles.length}
          icon={FileText}
          variant="success"
          trend={
            publishedArticles.length > 0
              ? { value: publishedArticles.length, label: "articles live" }
              : undefined
          }
        />
        <StatCard
          label="Drafts"
          value={draftArticles.length}
          icon={Clock}
          variant="default"
        />
        <StatCard
          label="Total Views"
          value={totalViews}
          icon={Eye}
          variant="info"
        />
        <StatCard
          label="Total Likes"
          value={totalLikes}
          icon={TrendingUp}
          variant="amber"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-lg border border-border bg-card p-4 shadow-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center shrink-0">
            <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-headline font-bold font-serif tabular-nums">
              {commentCount}
            </p>
            <p className="text-caption text-muted-foreground uppercase tracking-wide font-medium">
              Comments Posted
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
            <Bookmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-headline font-bold font-serif tabular-nums">
              {bookmarkCount}
            </p>
            <p className="text-caption text-muted-foreground uppercase tracking-wide font-medium">
              Bookmarked Articles
            </p>
          </div>
        </div>
      </div>

      {/* Recent articles or empty state */}
      {recentArticles.length > 0 ? (
        <section className="mb-8">
          <SectionHeader
            title="Recent Articles"
            href="/dashboard/articles"
            hrefLabel="View all"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentArticles.map((article) => (
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
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-serif font-semibold text-body mb-2">
            No articles yet
          </h3>
          <p className="text-body-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            Share your stories, perspectives, and insights with Katsina and
            beyond.
          </p>
          {canWrite && (
            <Button variant="amber" asChild>
              <Link href="/dashboard/articles/new">
                Write your first article
              </Link>
            </Button>
          )}
          {!canWrite && (
            <p className="text-caption text-muted-foreground">
              Your account role ({user?.role}) does not have permission to
              create articles. Contact an admin to upgrade your role.
            </p>
          )}
        </div>
      )}

      {/* Quick tips for new authors */}
      {myArticles.length === 0 && canWrite && (
        <div className="rounded-xl bg-ink-900 dark:bg-ink-800 text-white p-6">
          <h3 className="font-serif font-bold text-body mb-4 text-amber-400">
            Tips for great articles
          </h3>
          <ul className="space-y-2">
            {[
              "Write a compelling headline that summarises your story",
              "Add a clear excerpt — it appears in search results and social shares",
              "Include a high-quality cover image (recommended: 1200×630px)",
              "Assign relevant categories so readers can find your work",
              "Save as draft and review before publishing",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-body-sm">
                <span className="text-amber-400 font-bold shrink-0 mt-0.5">
                  {i + 1}.
                </span>
                <span className="text-white/80">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
