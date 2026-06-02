// apps/web/src/app/(public)/search/page.tsx
import type { Metadata } from "next";
import { SearchForm } from "@/components/public/search-form";
import { SearchResults } from "@/components/public/search-results";

export function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Metadata {
  // Note: searchParams is a promise in Next.js 15 but generateMetadata can
  // be synchronous — we read from the resolved params below in the component.
  // For metadata we use a static fallback title; the dynamic title is set in
  // the page component via the `title` export pattern.
  return {
    title: "Search Articles",
    description:
      "Search across thousands of articles from Pen Times Magazine on politics, education, community development, and more.",
    robots: {
      // Search pages should not be indexed to avoid duplicate content
      index: false,
      follow: true,
    },
  };
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; offset?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query = "", offset: offsetStr } = await searchParams;
  const offset = Number(offsetStr ?? 0);

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 pb-6 border-b-2 border-foreground">
        <p className="text-overline font-semibold uppercase tracking-widest text-amber-600 mb-2">
          Search
        </p>
        <h1 className="font-serif text-display font-bold mb-5 leading-tight">
          {query ? (
            <>
              Results for{" "}
              <span className="text-amber-600 dark:text-amber-400">
                &ldquo;{query}&rdquo;
              </span>
            </>
          ) : (
            "Search Pen Times"
          )}
        </h1>

        {/* Search form — navigateOnType=false so it updates URL in-place */}
        <SearchForm
          initialQuery={query}
          navigateOnType={false}
          className="max-w-2xl"
          autoFocus={!query}
        />
      </div>

      {/* Results — this is a Client Component that handles all interactivity */}
      <SearchResults query={query} offset={offset} />
    </div>
  );
}
