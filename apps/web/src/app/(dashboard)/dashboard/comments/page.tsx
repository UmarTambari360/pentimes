import { getServerClient } from "@/lib/graphql/client";
import { GET_MY_COMMENTS } from "@/lib/graphql/queries/comments";
import { formatRelativeDate } from "@/lib/utils";
import { MessageSquare, ExternalLink } from "lucide-react";
import Link from "next/link";

interface MyComment {
  id: string;
  body: string;
  articleId: string;
  createdAt: string;
}
interface MyCommentsResult {
  myComments: MyComment[];
}

export default async function CommentsPage() {
  let comments: MyComment[] = [];

  try {
    const client = await getServerClient();
    const data = await client.request<MyCommentsResult>(GET_MY_COMMENTS);
    comments = data.myComments;
  } catch {}

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-amber-500" />
        <h1 className="font-serif text-headline-xl font-bold">My Comments</h1>
      </div>

      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-lg border border-border bg-card shadow-card"
            >
              <p className="text-body-sm text-foreground mb-3">
                {comment.body}
              </p>
              <div className="flex items-center justify-between text-caption text-muted-foreground">
                <span>{formatRelativeDate(comment.createdAt)}</span>
                <Link
                  href={`/articles/`}
                  className="flex items-center gap-1 hover:text-amber-700 transition-colors"
                >
                  View article <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-lg border-dashed border-border">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-body-sm text-muted-foreground">No comments yet.</p>
        </div>
      )}
    </div>
  );
}
