import { getServerClient } from "@/lib/graphql/client";
import { GET_ARTICLES } from "@/lib/graphql/queries/articles";
import { GET_COMMENTS } from "@/lib/graphql/queries/comments";
import { CommentsModeration } from "@/components/admin/comments-moderation";
import type { ArticleCardType, CommentType } from "@/types";

export default async function AdminCommentsPage() {
  // For admin comments view, we'd need a dedicated resolver
  // For now, show a management UI placeholder
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-headline-xl font-bold">
          Comment Moderation
        </h1>
        <p className="text-caption text-muted-foreground mt-1">
          Review and moderate user comments
        </p>
      </div>
      <CommentsModeration />
    </div>
  );
}
