import { getServerClient } from "@/lib/graphql/client";
import { GET_MY_BOOKMARKS } from "@/lib/graphql/queries/articles";
import { ArticleCard } from "@/components/ui/article-card";
import { Bookmark, Info } from "lucide-react";
import type { ArticleCardType } from "@/types";

interface BookmarksResult {
  myBookmarks: ArticleCardType[];
}

export default async function BookmarksPage() {
  let bookmarks: ArticleCardType[] = [];
  let error = false;

  try {
    const client = await getServerClient();
    const data = await client.request<BookmarksResult>(GET_MY_BOOKMARKS, {
      limit: 100,
      offset: 0,
    });
    bookmarks = data.myBookmarks;
  } catch {
    error = true;
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
          <Bookmark className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="font-serif text-headline-xl font-bold">Bookmarks</h1>
          <p className="text-caption text-muted-foreground">
            {bookmarks.length} saved{" "}
            {bookmarks.length === 1 ? "article" : "articles"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <Info className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-body-sm text-destructive">
            Failed to load bookmarks. Please refresh the page.
          </p>
        </div>
      )}

      {bookmarks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="vertical"
              />
            ))}
          </div>
          <p className="text-caption text-muted-foreground text-center mt-8">
            Visit any article and click the bookmark icon to save or unsave
            articles.
          </p>
        </>
      ) : (
        !error && (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bookmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-serif font-semibold text-body mb-2">
              No bookmarks yet
            </h3>
            <p className="text-body-sm text-muted-foreground max-w-xs mx-auto">
              When you find articles worth saving, click the bookmark icon on
              any article to add it here.
            </p>
          </div>
        )
      )}
    </div>
  );
}
