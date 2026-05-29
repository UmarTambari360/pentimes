import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, TrendingUp, BookOpen, ArrowRight } from "lucide-react";
import { cachedClient } from "@/lib/graphql/client";
import { GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { GET_CATEGORIES } from "@/lib/graphql/queries/categories";
import { GET_UPCOMING_PROGRAMS } from "@/lib/graphql/queries/programs";
import { ArticleCard } from "@/components/ui/article-card";
import { SectionHeader } from "@/components/public/section-header";
import { CategoryBadge } from "@/components/ui/category-badge";
import { FeaturedSlider } from "@/components/public/featured-slider";
import { BreakingNewsTicker } from "@/components/public/breaking-news-ticker";
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
  alternates: {
    canonical: process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://pentimes.ng",
  },
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
        filters: { status: "published", limit: 13, offset: 0 },
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

  // Slice deliberately:
  // [0..2]  → featured slider (up to 3 hero articles)
  // [3..8]  → latest stories grid (6 articles)
  // [9..12] → sidebar compact list (4 articles)
  const featuredArticles = articles.slice(0, 3);
  const latestArticles = articles.slice(3, 9);
  const sidebarArticles = articles.slice(9, 13);

  return (
    <>
      {/* ── Breaking news ticker ──────────────────────────────── */}
      <BreakingNewsTicker />

      <div className="max-w-container-lg mx-auto px-4 sm:px-6 py-8">
        {/* ── Hero: Featured slider + sidebar ──────────────────── */}
        {featuredArticles.length > 0 && (
          <section className="mb-10" aria-label="Featured stories">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Featured slider — 2/3 width on desktop */}
              <div className="lg:col-span-2">
                <FeaturedSlider articles={featuredArticles} />
              </div>

              {/* Sidebar latest — 1/3 width on desktop */}
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
                {/* "View all" link at the bottom of the sidebar */}
                <Link
                  href="/articles"
                  className="mt-4 flex items-center gap-1.5 text-caption font-semibold text-amber-700 dark:text-amber-400 hover:underline underline-offset-2"
                >
                  All stories <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Categories strip ─────────────────────────────────── */}
        {categories.length > 0 && (
          <section
            className="mb-10 py-4 border-y border-border"
            aria-label="Browse by topic"
          >
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
              <span className="text-caption font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                Topics:
              </span>
              {categories.map((cat) => (
                <CategoryBadge
                  key={cat.id}
                  name={cat.name}
                  slug={cat.slug}
                  className="shrink-0"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Latest stories grid ──────────────────────────────── */}
        {latestArticles.length > 0 && (
          <section className="mb-10" aria-label="Latest stories">
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

        {/* ── Upcoming programs ────────────────────────────────── */}
        {programs.length > 0 && (
          <section className="mb-10" aria-label="Upcoming programs">
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
                  {program.description && (
                    <p className="text-caption text-muted-foreground line-clamp-2">
                      {program.description}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 text-caption text-muted-foreground mt-auto">
                    <Calendar className="h-3 w-3 shrink-0 text-amber-500" />
                    {formatDate(program.scheduledAt)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Mission strip ────────────────────────────────────── */}
        <section
          className="mb-6 rounded-xl bg-ink-900 dark:bg-ink-800 text-white p-8 sm:p-12"
          aria-label="About Pen Times"
        >
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
              journalism. Pen Times Magazine brings you the stories that matter
              — from the corridors of power to the grassroots of Katsina State.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-ink-900 font-semibold text-body-sm px-5 py-2.5 rounded-md transition-colors"
              >
                About Us →
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold text-body-sm px-5 py-2.5 rounded-md transition-colors"
              >
                Browse Stories
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
