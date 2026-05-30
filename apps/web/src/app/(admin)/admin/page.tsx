import { getServerClient } from "@/lib/graphql/client";
import { GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { GET_USERS } from "@/lib/graphql/queries/users";
import { GET_ALL_COMMENTS } from "@/lib/graphql/queries/comments";
import { StatCard } from "@/components/ui/stat-card";
import { SectionHeader } from "@/components/public/section-header";
import { ArticleCard } from "@/components/ui/article-card";
import {
  FileText,
  Users,
  Eye,
  MessageSquare,
  TrendingUp,
  BookOpen,
  CheckCircle,
  Clock,
} from "lucide-react";
import type { ArticleCardType, UserType } from "@/types";

interface ArticlesResult {
  articles: { items: ArticleCardType[]; total: number };
}
interface UsersResult {
  users: UserType[];
}
interface CommentsResult {
  allComments: { total: number };
}

export default async function AdminPage() {
  let totalArticles = 0,
    publishedArticles = 0,
    draftArticles = 0,
    totalUsers = 0,
    totalViews = 0,
    totalComments = 0,
    recentArticles: ArticleCardType[] = [];

  try {
    const client = await getServerClient();
    const [articlesData, usersData, commentsData] = await Promise.allSettled([
      client.request<ArticlesResult>(GET_ARTICLES, {
        filters: { limit: 100, offset: 0 },
      }),
      client.request<UsersResult>(GET_USERS),
      client.request<CommentsResult>(GET_ALL_COMMENTS, { limit: 1, offset: 0 }),
    ]);

    if (articlesData.status === "fulfilled") {
      totalArticles = articlesData.value.articles.total;
      const items = articlesData.value.articles.items;
      publishedArticles = items.filter((a) => a.status === "published").length;
      draftArticles = items.filter((a) => a.status === "draft").length;
      totalViews = items.reduce((s, a) => s + a.views, 0);
      recentArticles = items.slice(0, 6);
    }
    if (usersData.status === "fulfilled") {
      totalUsers = usersData.value.users.length;
    }
    if (commentsData.status === "fulfilled") {
      totalComments = commentsData.value.allComments.total;
    }
  } catch {}

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-headline-xl font-bold">
          Admin Overview
        </h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Platform-wide statistics and management console
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Total Articles"
          value={totalArticles}
          icon={FileText}
          variant="amber"
        />
        <StatCard
          label="Published"
          value={publishedArticles}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard label="Drafts" value={draftArticles} icon={Clock} />
        <StatCard
          label="Total Users"
          value={totalUsers}
          icon={Users}
          variant="info"
        />
        <StatCard
          label="Total Views"
          value={totalViews}
          icon={Eye}
          variant="amber"
        />
        <StatCard label="Comments" value={totalComments} icon={MessageSquare} />
        <StatCard label="Authors" value={0} icon={BookOpen} variant="info" />
        <StatCard
          label="Growth"
          value="↑ Active"
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Recent articles */}
      {recentArticles.length > 0 && (
        <section>
          <SectionHeader
            title="Recent Articles"
            href="/admin/articles"
            hrefLabel="Manage all"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="vertical"
                showStatus
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
