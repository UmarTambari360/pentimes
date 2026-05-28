import { getServerClient } from "@/lib/graphql/client";
import { GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { GET_USERS } from "@/lib/graphql/queries/users";
import { StatCard } from "@/components/ui/stat-card";
import { FileText, Users, Eye, MessageSquare } from "lucide-react";
import type { ArticleCardType, UserType } from "@/types";

interface ArticlesResult {
  articles: { items: ArticleCardType[]; total: number };
}
interface UsersResult {
  users: UserType[];
}

export default async function AdminPage() {
  let totalArticles = 0,
    publishedArticles = 0,
    totalUsers = 0,
    totalViews = 0;

  try {
    const client = await getServerClient();
    const [articlesData, usersData] = await Promise.allSettled([
      client.request<ArticlesResult>(GET_ARTICLES, {
        filters: { limit: 100, offset: 0 },
      }),
      client.request<UsersResult>(GET_USERS),
    ]);

    if (articlesData.status === "fulfilled") {
      totalArticles = articlesData.value.articles.total;
      publishedArticles = articlesData.value.articles.items.filter(
        (a) => a.status === "published",
      ).length;
      totalViews = articlesData.value.articles.items.reduce(
        (s, a) => s + a.views,
        0,
      );
    }
    if (usersData.status === "fulfilled") {
      totalUsers = usersData.value.users.length;
    }
  } catch {}

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-serif text-headline-xl font-bold">
          Admin Overview
        </h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Platform-wide statistics and management
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Articles"
          value={totalArticles}
          icon={FileText}
          variant="amber"
        />
        <StatCard
          label="Published"
          value={publishedArticles}
          icon={FileText}
          variant="success"
        />
        <StatCard
          label="Total Users"
          value={totalUsers}
          icon={Users}
          variant="info"
        />
        <StatCard label="Total Views" value={totalViews} icon={Eye} />
      </div>

      <div className="rounded-lg border-2 border-dashed border-border p-8 text-center text-muted-foreground">
        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-body-sm">
          Use the sidebar to manage articles, categories, users, and programs.
        </p>
      </div>
    </div>
  );
}
