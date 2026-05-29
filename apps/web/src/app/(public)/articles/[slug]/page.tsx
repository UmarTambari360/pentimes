'use client';

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Eye } from "lucide-react";
import { getServerClient, cachedClient } from "@/lib/graphql/client";
import { GET_ARTICLE, GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { GET_COMMENTS } from "@/lib/graphql/queries/comments";
import { ArticleCard } from "@/components/ui/article-card";
import { CategoryBadge } from "@/components/ui/category-badge";
import { AuthorAvatar } from "@/components/ui/author-avatar";
import { ArticleActions } from "@/components/public/article-actions";
import { CommentsSection } from "@/components/public/comments-section";
import { formatDate, formatReadingTime } from "@/lib/utils";
import type {
  ArticleFullType,
  ArticleCardType,
  CommentConnectionResult,
} from "@/types";

interface ArticleResult {
  article: ArticleFullType | null;
}
interface ArticlesResult {
  articles: { items: ArticleCardType[] };
}
interface CommentsResult {
  comments: CommentConnectionResult;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const client = cachedClient(300);

  try {
    const data = await client.request<ArticleResult>(GET_ARTICLE, { slug });
    const article = data.article;
    if (!article) return {};

    return {
      title: article.title,
      description: article.excerpt ?? undefined,
      openGraph: {
        title: article.title,
        description: article.excerpt ?? undefined,
        images: article.coverImage ? [{ url: article.coverImage }] : [],
        type: "article",
        publishedTime: article.publishedAt ?? undefined,
        authors: [article.author.name],
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description: article.excerpt ?? undefined,
        images: article.coverImage ? [article.coverImage] : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Try authenticated client first (for isLiked/isBookmarked)
  let article: ArticleFullType | null = null;
  try {
    const client = await getServerClient();
    const data = await client.request<ArticleResult>(GET_ARTICLE, { slug });
    article = data.article;
  } catch {
    const client = cachedClient(300);
    try {
      const data = await client.request<ArticleResult>(GET_ARTICLE, { slug });
      article = data.article;
    } catch {
      notFound();
    }
  }

  if (!article) notFound();

  const publicClient = cachedClient(300);

  // Fetch related articles and comments in parallel
  const [relatedData, commentsData] = await Promise.allSettled([
    publicClient.request<ArticlesResult>(GET_ARTICLES, {
      filters: {
        status: "published",
        categorySlug: article.categories[0]?.slug,
        limit: 4,
        offset: 0,
      },
    }),
    publicClient.request<CommentsResult>(GET_COMMENTS, {
      articleId: article.id,
      limit: 20,
      offset: 0,
    }),
  ]);

  const relatedArticles =
    relatedData.status === "fulfilled"
      ? relatedData.value.articles.items
          .filter((a) => a.id !== article!.id)
          .slice(0, 3)
      : [];

  const comments =
    commentsData.status === "fulfilled"
      ? commentsData.value.comments
      : { items: [], total: 0 };

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: article.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: "Pen Times Magazine",
      logo: {
        "@type": "ImageObject",
        url: `${process.env["NEXT_PUBLIC_SITE_URL"]}/logo.png`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-container mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          {/* ── Article main ── */}
          <article>
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {article.categories.map((cat) => (
                <CategoryBadge key={cat.id} name={cat.name} slug={cat.slug} />
              ))}
            </div>

            {/* Title */}
            <h1 className="font-serif text-headline-xl sm:text-display font-bold leading-tight mb-4 text-balance">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-body-lg text-muted-foreground mb-6 leading-relaxed font-medium border-l-4 border-amber-500 pl-4 italic">
                {article.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-caption text-muted-foreground mb-6 pb-4 border-b border-border">
              <AuthorAvatar
                author={article.author}
                size="sm"
                showName
                linkable
              />
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(article.publishedAt ?? article.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatReadingTime(article.readingTime)}
              </span>
              <span className="flex items-center gap-1.5 ml-auto">
                <Eye className="h-3.5 w-3.5" />
                {article.views.toLocaleString()} views
              </span>
            </div>

            {/* Cover image */}
            {article.coverImage && (
              <div className="relative aspect-[16/9] mb-8 rounded-lg overflow-hidden shadow-editorial">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 900px"
                  priority
                />
              </div>
            )}

            {/* Content */}
            <div
              className="article-prose max-w-prose-wide mb-8"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Actions */}
            <ArticleActions
              articleId={article.id}
              slug={article.slug}
              title={article.title}
              initialLiked={article.isLiked ?? false}
              initialBookmarked={article.isBookmarked ?? false}
              likeCount={article.likeCount}
            />

            {/* Author bio */}
            {article.author.bio && (
              <div className="mt-8 p-6 rounded-lg border border-border bg-muted/30 flex gap-4">
                <AuthorAvatar author={article.author} size="lg" />
                <div>
                  <p className="font-serif font-semibold text-body mb-1">
                    {article.author.name}
                  </p>
                  <p className="text-body-sm text-muted-foreground">
                    {article.author.bio}
                  </p>
                </div>
              </div>
            )}

            {/* Comments */}
            <CommentsSection
              articleId={article.id}
              initialComments={comments.items}
              initialTotal={comments.total}
            />
          </article>

          {/* ── Sidebar ── */}
          <aside className="space-y-8">
            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div>
                <div className="border-t-2 border-foreground mb-3">
                  <h3 className="font-serif text-headline font-bold mt-3">
                    Related Stories
                  </h3>
                </div>
                <div className="flex flex-col">
                  {relatedArticles.map((related) => (
                    <ArticleCard
                      key={related.id}
                      article={related}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div>
              <div className="border-t-2 border-foreground mb-3">
                <h3 className="font-serif text-headline font-bold mt-3">
                  Share
                </h3>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`${process.env["NEXT_PUBLIC_SITE_URL"]}/articles/${article.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 bg-ink-900 text-white text-caption font-semibold rounded-md hover:bg-ink-700 transition-colors"
                >
                  Twitter
                </Link>
                <Link
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${process.env["NEXT_PUBLIC_SITE_URL"]}/articles/${article.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 bg-blue-600 text-white text-caption font-semibold rounded-md hover:bg-blue-700 transition-colors"
                >
                  Facebook
                </Link>
                <Link
                  href={`https://wa.me/?text=${encodeURIComponent(`${article.title} - ${process.env["NEXT_PUBLIC_SITE_URL"]}/articles/${article.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 bg-green-600 text-white text-caption font-semibold rounded-md hover:bg-green-700 transition-colors"
                >
                  WhatsApp
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
