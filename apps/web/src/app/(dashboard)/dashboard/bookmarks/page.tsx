import { getServerClient } from "@/lib/graphql/client";
import { GET_MY_BOOKMARKS } from "@/lib/graphql/queries/articles";
import { ArticleCard } from "@/components/ui/article-card";
import { Bookmark } from "lucide-react";
import type { ArticleCardType } from "@/types";

interface BookmarksResult {
  myBookmarks: ArticleCardType[];
}

export default async function BookmarksPage() {
  let bookmarks: ArticleCardType[] = [];

  try {
    const client = await getServerClient();
    const data = await client.request<BookmarksResult>(GET_MY_BOOKMARKS, {
      limit: 50,
      offset: 0,
    });
    bookmarks = data.myBookmarks;
  } catch {}

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6 flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-amber-500" />
        <h1 className="font-serif text-headline-xl font-bold">Bookmarks</h1>
      </div>

      {bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bookmarks.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              variant="horizontal"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-lg border-dashed border-border">
          <Bookmark className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-body-sm text-muted-foreground">
            No bookmarks yet.
          </p>
          <p className="text-caption text-muted-foreground">
            Save articles you want to read later.
          </p>
        </div>
      )}
    </div>
  );
}
