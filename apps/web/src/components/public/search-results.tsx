"use client";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { GraphQLClient } from "graphql-request";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, AlertCircle } from "lucide-react";
import { SEARCH_ARTICLES } from "@/lib/graphql/queries/articles";
import { ArticleCard } from "@/components/ui/article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import type { ArticleCardType } from "@/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";
const client = new GraphQLClient(`${API_URL}/graphql`);

const LIMIT = 12;

interface SearchResult {
  searchArticles: {
    items: ArticleCardType[];
    total: number;
    hasMore: boolean;
  };
}

interface SearchResultsProps {
  /** The raw query from the URL — passed from the Server Component. */
  query: string;
  offset?: number;
}

function ResultSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[16/10] rounded-md" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-serif text-headline font-bold mb-2">
        No results for &ldquo;{query}&rdquo;
      </h3>
      <p className="text-body-sm text-muted-foreground max-w-sm mb-6">
        Try different keywords, check your spelling, or browse our sections
        below.
      </p>
      <div className="flex flex-wrap gap-2 justify-center text-caption text-muted-foreground">
        <span>Suggestions:</span>
        {["politics", "education", "community", "Katsina"].map((s) => (
          <Link
            key={s}
            href={`/search?q=${s}`}
            className="text-amber-700 dark:text-amber-400 hover:underline"
          >
            {s}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

function BlankState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-serif text-headline font-bold mb-2">
        Search Pen Times
      </h3>
      <p className="text-body-sm text-muted-foreground max-w-sm">
        Enter a keyword to search across thousands of articles on politics,
        education, community development, and more.
      </p>
      <p className="text-caption text-muted-foreground mt-4 opacity-60">
        Tip: Press{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[0.7rem]">
          /
        </kbd>{" "}
        to focus search from anywhere
      </p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="font-serif text-headline font-bold mb-2">
        Search unavailable
      </h3>
      <p className="text-body-sm text-muted-foreground">
        Something went wrong. Please try again in a moment.
      </p>
    </div>
  );
}

export function SearchResults({ query, offset = 0 }: SearchResultsProps) {
  const [items, setItems] = useState<ArticleCardType[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(offset);

  // Use the debounced query so the fetch only fires after typing stops
  const debouncedQuery = useDebounce(query.trim(), 400);

  const fetchResults = useCallback(
    async (q: string, off: number, append = false) => {
      if (q.length < 2) {
        setItems([]);
        setTotal(0);
        setHasMore(false);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const data = await client.request<SearchResult>(SEARCH_ARTICLES, {
          query: q,
          limit: LIMIT,
          offset: off,
        });

        const result = data.searchArticles;

        setItems((prev) =>
          append ? [...prev, ...result.items] : result.items,
        );
        setTotal(result.total);
        setHasMore(result.hasMore);
        setCurrentOffset(off);
      } catch {
        setError(true);
        if (!append) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Fetch when debounced query changes — always reset to page 1
  useEffect(() => {
    setCurrentOffset(0);
    fetchResults(debouncedQuery, 0, false);
  }, [debouncedQuery, fetchResults]);

  const loadMore = () => {
    const nextOffset = currentOffset + LIMIT;
    fetchResults(debouncedQuery, nextOffset, true);
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (!query) return <BlankState />;

  if (loading && items.length === 0) return <ResultSkeleton />;

  if (error && items.length === 0) return <ErrorState />;

  if (!loading && items.length === 0 && debouncedQuery.length >= 2) {
    return <EmptyState query={debouncedQuery} />;
  }

  return (
    <div className="space-y-8">
      {/* Result count */}
      <AnimatePresence mode="wait">
        {total > 0 && (
          <motion.p
            key={debouncedQuery}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-body-sm text-muted-foreground"
          >
            {total.toLocaleString()} {total === 1 ? "result" : "results"} for{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{debouncedQuery}&rdquo;
            </span>
          </motion.p>
        )}
      </AnimatePresence>

      {/* Results grid */}
      <motion.div
        key={debouncedQuery}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {items.map((article, idx) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.3 }}
          >
            <ArticleCard article={article} variant="vertical" />
          </motion.div>
        ))}

        {/* Skeleton rows while appending more */}
        {loading &&
          items.length > 0 &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="space-y-3">
              <Skeleton className="aspect-[16/10] rounded-md" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
      </motion.div>

      {/* Load more */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore} className="gap-2">
            Load more results
          </Button>
        </div>
      )}

      {/* Loading indicator for load-more */}
      {loading && items.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
