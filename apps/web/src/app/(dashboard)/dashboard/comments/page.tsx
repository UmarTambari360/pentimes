import { getServerClient } from "@/lib/graphql/client";
import { GET_MY_COMMENTS } from "@/lib/graphql/queries/comments";
import { DashboardCommentsClient } from "@/components/dashboard/comments-client";
import { MessageSquare } from "lucide-react";

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
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="font-serif text-headline-xl font-bold">My Comments</h1>
          <p className="text-caption text-muted-foreground">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}{" "}
            posted
          </p>
        </div>
      </div>

      <DashboardCommentsClient initialComments={comments} />
    </div>
  );
}
