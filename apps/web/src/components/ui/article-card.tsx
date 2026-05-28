import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, MessageCircle, Heart } from "lucide-react";
import { CategoryBadge } from "./category-badge";
import { AuthorAvatar } from "./author-avatar";
import { ArticleStatusBadge } from "./article-status-badge";
import { formatRelativeDate, formatReadingTime, cn } from "@/lib/utils";
import type { ArticleCardType } from "@/types";

interface ArticleCardProps {
  article: ArticleCardType;
  variant?: "vertical" | "horizontal" | "featured" | "compact";
  showStatus?: boolean;
  className?: string;
}

export function ArticleCard({
  article,
  variant = "vertical",
  showStatus = false,
  className,
}: ArticleCardProps) {
  if (variant === "compact") {
    return (
      <article
        className={cn(
          "flex gap-3 py-3 border-b border-border last:border-0",
          className,
        )}
      >
        {article.coverImage && (
          <Link href={`/articles/${article.slug}`} className="shrink-0">
            <div className="relative h-16 w-20 overflow-hidden rounded-sm">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="80px"
              />
            </div>
          </Link>
        )}
        <div className="flex-1 min-w-0">
          {article.categories[0] && (
            <CategoryBadge
              name={article.categories[0].name}
              slug={article.categories[0].slug}
              className="mb-1 text-[0.6rem]"
            />
          )}
          <Link href={`/articles/${article.slug}`}>
            <h3 className="font-serif text-body-sm font-semibold leading-snug line-clamp-2 hover:text-amber-700 transition-colors">
              {article.title}
            </h3>
          </Link>
          <p className="text-caption text-muted-foreground mt-1">
            {formatRelativeDate(article.publishedAt ?? article.createdAt)}
          </p>
        </div>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article
        className={cn(
          "group flex gap-4 p-4 rounded-lg hover:bg-muted/30 transition-colors",
          className,
        )}
      >
        {article.coverImage && (
          <Link href={`/articles/${article.slug}`} className="shrink-0">
            <div className="relative h-24 w-36 sm:h-28 sm:w-44 overflow-hidden rounded-md">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 144px, 176px"
              />
            </div>
          </Link>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {article.categories.slice(0, 2).map((cat) => (
                <CategoryBadge
                  key={cat.id}
                  name={cat.name}
                  slug={cat.slug}
                  className="text-[0.6rem]"
                />
              ))}
              {showStatus && <ArticleStatusBadge status={article.status} />}
            </div>
            <Link href={`/articles/${article.slug}`}>
              <h3 className="font-serif text-headline font-semibold leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors mb-2">
                {article.title}
              </h3>
            </Link>
            {article.excerpt && (
              <p className="text-caption text-muted-foreground line-clamp-2 hidden sm:block">
                {article.excerpt}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-caption text-muted-foreground">
            <AuthorAvatar author={article.author} size="xs" showName />
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatReadingTime(article.readingTime)}
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <Eye className="h-3 w-3" />
              {article.views.toLocaleString()}
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "featured") {
    return (
      <article
        className={cn("group relative overflow-hidden rounded-xl", className)}
      >
        {article.coverImage ? (
          <div className="relative aspect-[16/9] sm:aspect-[16/10]">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/40 to-transparent" />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-ink-800" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {article.categories.slice(0, 2).map((cat) => (
              <CategoryBadge
                key={cat.id}
                name={cat.name}
                slug={cat.slug}
                className="bg-amber-500 text-ink-900"
              />
            ))}
          </div>
          <Link href={`/articles/${article.slug}`}>
            <h2 className="font-serif text-headline-lg sm:text-headline-xl font-bold text-white leading-tight line-clamp-3 group-hover:text-amber-200 transition-colors mb-3">
              {article.title}
            </h2>
          </Link>
          <div className="flex items-center gap-3 text-caption text-white/70">
            <AuthorAvatar author={article.author} size="xs" showName />
            <span>·</span>
            <span>
              {formatRelativeDate(article.publishedAt ?? article.createdAt)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatReadingTime(article.readingTime)}
            </span>
          </div>
        </div>
      </article>
    );
  }

  // Default: vertical
  return (
    <article className={cn("group flex flex-col", className)}>
      {article.coverImage && (
        <Link href={`/articles/${article.slug}`} className="block mb-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-md">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        </Link>
      )}
      <div className="flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {article.categories.slice(0, 2).map((cat) => (
            <CategoryBadge
              key={cat.id}
              name={cat.name}
              slug={cat.slug}
              className="text-[0.6rem]"
            />
          ))}
          {showStatus && <ArticleStatusBadge status={article.status} />}
        </div>
        <Link href={`/articles/${article.slug}`}>
          <h3 className="font-serif text-headline font-semibold leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors mb-2 text-balance">
            {article.title}
          </h3>
        </Link>
        {article.excerpt && (
          <p className="text-body-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 text-caption text-muted-foreground mt-auto">
          <AuthorAvatar author={article.author} size="xs" showName />
          <span>·</span>
          <span>
            {formatRelativeDate(article.publishedAt ?? article.createdAt)}
          </span>
          <span className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {article.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {article.commentCount}
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}
