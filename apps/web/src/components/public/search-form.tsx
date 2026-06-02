"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface SearchFormProps {
  initialQuery?: string;
  /**
   * When true, the form navigates to /search as the user types
   * (used on the homepage). When false, it updates the URL in-place
   * (used on /search itself).
   */
  navigateOnType?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function SearchForm({
  initialQuery = "",
  navigateOnType = false,
  className,
  autoFocus = false,
}: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 400);

  // Sync URL when debounced query changes (only on /search page)
  useEffect(() => {
    if (navigateOnType) return;

    const trimmed = debouncedQuery.trim();

    // Avoid pushing identical URLs
    const current = searchParams.get("q") ?? "";
    if (trimmed === current) return;

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("q", trimmed);
        params.delete("offset"); // reset pagination on new search
      } else {
        params.delete("q");
        params.delete("offset");
      }
      router.replace(`/search?${params.toString()}`);
    });
  }, [debouncedQuery, navigateOnType, router, searchParams]);

  // Keyboard shortcut: / focuses the search input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    });
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
    if (!navigateOnType) {
      startTransition(() => {
        router.replace("/search");
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
      <div className="relative flex-1">
        {isPending ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, topics…"
          className="pl-9 pr-9 h-10"
          autoFocus={autoFocus}
          aria-label="Search articles"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button
        type="submit"
        variant="amber"
        size="sm"
        disabled={isPending || !query.trim()}
        className="shrink-0"
      >
        Search
      </Button>
    </form>
  );
}
