"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { CategoryBadge } from "@/components/ui/category-badge";
import { AuthorAvatar } from "@/components/ui/author-avatar";
import { formatRelativeDate, formatReadingTime } from "@/lib/utils";
import type { ArticleCardType } from "@/types";

interface FeaturedSliderProps {
  articles: ArticleCardType[];
}

export function FeaturedSlider({ articles }: FeaturedSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const count = articles.length;

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + count) % count);
  }, [count]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (!isAutoPlaying || count <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next, count]);

  if (!articles.length) return null;

  const article = articles[current]!;

  return (
    <div
      className="relative overflow-hidden rounded-xl group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      aria-roledescription="carousel"
      aria-label="Featured articles"
    >
      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={article.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative aspect-[16/9] sm:aspect-[16/10]"
        >
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-ink-900" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/95 via-ink-900/50 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-3">
              {article.categories.slice(0, 2).map((cat) => (
                <CategoryBadge
                  key={cat.id}
                  name={cat.name}
                  slug={cat.slug}
                  className="bg-amber-500 text-ink-900 hover:bg-amber-400"
                />
              ))}
            </div>

            {/* Title */}
            <Link href={`/articles/${article.slug}`}>
              <h2 className="font-serif text-headline-lg sm:text-headline-xl font-bold text-white leading-tight line-clamp-3 hover:text-amber-200 transition-colors mb-3">
                {article.title}
              </h2>
            </Link>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-body-sm text-white/70 line-clamp-2 mb-4 hidden sm:block max-w-prose">
                {article.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-caption text-white/60">
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
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows — only show when multiple slides */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Previous article"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Next article"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div
          className="absolute bottom-4 right-4 flex gap-1.5"
          role="tablist"
          aria-label="Select article"
        >
          {articles.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === current}
              aria-label={`Article ${idx + 1}`}
              onClick={() => {
                setCurrent(idx);
                setIsAutoPlaying(false);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                idx === current
                  ? "w-6 bg-amber-500"
                  : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
