import type { Metadata } from "next";
import { cachedClient } from "@/lib/graphql/client";
import { SEARCH_ARTICLES } from "@/lib/graphql/queries/articles";
import { ArticleCard } from "@/components/ui/article-card";
import { SearchForm } from "@/components/public/search-form";
import { Pagination } from "@/components/public/pagination";
import type { ArticleCardType } from "@/types";

export const metadata: Metadata = {
  title: "Search",
  description: "Search all articles on Pen Times Magazine",
};

interface SearchResult {
  searchArticles: { items: ArticleCardType[]; total: number };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; offset?: string }>;
}) {
  const { q: query, offset: offsetStr } = await searchParams;
  const offset = Number(offsetStr ?? 0);
  const limit = 12;

  let results: { items: ArticleCardType[]; total: number } = {
    items: [],
    total: 0,
  };

  if (query && query.length >= 2) {
    const client = cachedClient(120);
    try {
      const data = await client.request<SearchResult>(SEARCH_ARTICLES, {
        query,
        limit,
        offset,
      });
      results = data.searchArticles;
    } catch {}
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 pb-4 border-b-2 border-foreground">
        <h1 className="font-serif text-display font-bold mb-4">Search</h1>
        <SearchForm initialQuery={query} />
      </div>

      {query && (
        <div className="mb-6">
          <p className="text-body-sm text-muted-foreground">
            {results.total > 0
              ? `${results.total.toLocaleString()} result${results.total === 1 ? "" : "s"} for "${query}"`
              : `No results for "${query}"`}
          </p>
        </div>
      )}

      {results.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {results.items.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="vertical"
              />
            ))}
          </div>
          <Pagination total={results.total} limit={limit} offset={offset} />
        </>
      ) : query ? (
        <div className="text-center py-16">
          <p className="text-body text-muted-foreground mb-2">
            No articles match your search.
          </p>
          <p className="text-body-sm text-muted-foreground">
            Try different keywords or browse our sections.
          </p>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-body text-muted-foreground">
            Enter a search term to find articles.
          </p>
        </div>
      )}
    </div>
  );
}
