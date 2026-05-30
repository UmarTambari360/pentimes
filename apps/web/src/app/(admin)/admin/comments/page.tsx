import { getServerClient } from "@/lib/graphql/client";
import { GET_ALL_COMMENTS } from "@/lib/graphql/queries/comments";
import { AdminCommentsClient } from "@/components/admin/comments-moderation";
import { MessageSquare } from "lucide-react";
import type { CommentWithContextConnectionResult } from "@/types";

interface AllCommentsResult {
  allComments: CommentWithContextConnectionResult;
}

export default async function AdminCommentsPage() {
  let initialData: CommentWithContextConnectionResult = { items: [], total: 0 };

  try {
    const client = await getServerClient();
    const data = await client.request<AllCommentsResult>(GET_ALL_COMMENTS, {
      limit: 30,
      offset: 0,
    });
    initialData = data.allComments;
  } catch {
    // Render with empty state
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-serif text-headline-xl font-bold">
          Comment Moderation
        </h1>
        <p className="text-caption text-muted-foreground mt-1">
          {initialData.total} total comment
          {initialData.total !== 1 ? "s" : ""} across the platform
        </p>
      </div>

      <AdminCommentsClient
        initialComments={initialData.items}
        initialTotal={initialData.total}
      />
    </div>
  );
}
