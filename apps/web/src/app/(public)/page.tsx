import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, TrendingUp, BookOpen } from "lucide-react";
import { cachedClient } from "@/lib/graphql/client";
import { GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { GET_CATEGORIES } from "@/lib/graphql/queries/categories";
import { GET_UPCOMING_PROGRAMS } from "@/lib/graphql/queries/programs";
import { ArticleCard } from "@/components/ui/article-card";
import { SectionHeader } from "@/components/public/section-header";
import { CategoryBadge } from "@/components/ui/category-badge";
import { formatDate, cn } from "@/lib/utils";
import type {
  ArticleCardType,
  CategoryType,
  ScheduledProgramType,
} from "@/types";

export const metadata: Metadata = {
  title: "Pen Times Magazine — Katsina's Voice",
  description:
    "Your trusted source for news, politics, education, and community development from Katsina State and beyond.",
};

interface ArticlesResult {
  articles: { items: ArticleCardType[]; total: number; hasMore: boolean };
}
interface CategoriesResult {
  categories: CategoryType[];
}
interface ProgramsResult {
  upcomingPrograms: ScheduledProgramType[];
}

async function getHomeData() {
  const client = cachedClient(300);

  const [articlesData, categoriesData, programsData] = await Promise.allSettled(
    [
      client.request<ArticlesResult>(GET_ARTICLES, {
        filters: { status: "published", limit: 12, offset: 0 },
      }),
      client.request<CategoriesResult>(GET_CATEGORIES),
      client.request<ProgramsResult>(GET_UPCOMING_PROGRAMS, { limit: 4 }),
    ],
  );

  return {
    articles:
      articlesData.status === "fulfilled"
        ? articlesData.value.articles.items
        : [],
    categories:
      categoriesData.status === "fulfilled"
        ? categoriesData.value.categories
        : [],
    programs:
      programsData.status === "fulfilled"
        ? programsData.value.upcomingPrograms
        : [],
  };
}

export default async function HomePage() {
  const { articles, categories, programs } = await getHomeData();

  const [featuredArticle, ...restArticles] = articles;
  const latestArticles = restArticles.slice(0, 6);
  const sidebarArticles = restArticles.slice(6, 10);

  return (
    <div className="max-w-container-lg mx-auto px-4 sm:px-6 py-8">
      {/* ── Hero Section ─────────────────────────────── */}
      {featuredArticle && (
        <section className="mb-10">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Featured article */}
            <div className="lg:col-span-2">
              <ArticleCard article={featuredArticle} variant="featured" />
            </div>

            {/* Latest sidebar */}
            <div className="flex flex-col">
              <SectionHeader title="Latest" variant="rule" className="mb-3" />
              <div className="flex flex-col divide-y divide-border">
                {sidebarArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Categories strip ─────────────────────────── */}
      {categories.length > 0 && (
        <section className="mb-10 py-4 border-y border-border">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <span className="text-caption font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
              Topics:
            </span>
            {categories.map((cat) => (
              <CategoryBadge key={cat.id} name={cat.name} slug={cat.slug} />
            ))}
          </div>
        </section>
      )}

      {/* ── Latest Articles grid ─────────────────────── */}
      {latestArticles.length > 0 && (
        <section className="mb-10">
          <SectionHeader
            title="Latest Stories"
            href="/articles"
            hrefLabel="All stories"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="vertical"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Upcoming Programs ────────────────────────── */}
      {programs.length > 0 && (
        <section className="mb-10">
          <SectionHeader
            title="Upcoming Programs"
            href="/programs"
            hrefLabel="View all"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {programs.map((program) => (
              <div
                key={program.id}
                className={cn(
                  "rounded-lg border border-border p-4 bg-card shadow-card",
                  "flex flex-col gap-2 hover:shadow-editorial transition-shadow",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {program.status}
                  </span>
                  {program.durationMinutes && (
                    <span className="text-caption text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {program.durationMinutes}m
                    </span>
                  )}
                </div>
                <h3 className="font-serif font-semibold text-body-sm leading-snug line-clamp-2">
                  {program.title}
                </h3>
                <p className="flex items-center gap-1.5 text-caption text-muted-foreground mt-auto">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {formatDate(program.scheduledAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Mission strip ────────────────────────────── */}
      <section className="mb-6 rounded-xl bg-ink-900 dark:bg-ink-800 text-white p-8 sm:p-12">
        <div className="max-w-prose">
          <span className="inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-widest text-amber-400 mb-4">
            <TrendingUp className="h-3.5 w-3.5" />
            Our Mission
          </span>
          <h2 className="font-serif text-headline-xl sm:text-display font-bold mb-4 text-balance leading-tight">
            Katsina&apos;s Voice,
            <br />
            <em className="text-amber-400 not-italic">Your Story</em>
          </h2>
          <p className="text-body text-white/70 mb-6 max-w-prose-narrow">
            We believe every community deserves access to quality, unbiased
            journalism. Pen Times Magazine brings you the stories that matter —
            from the corridors of power to the grassroots of Katsina State.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-ink-900 font-semibold text-body-sm px-5 py-2.5 rounded-md transition-colors"
          >
            About Us →
          </Link>
        </div>
      </section>
    </div>
  );
}
