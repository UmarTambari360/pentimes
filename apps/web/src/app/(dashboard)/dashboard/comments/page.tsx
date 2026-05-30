import { getServerClient } from "@/lib/graphql/client";
import { GET_MY_COMMENTS } from "@/lib/graphql/queries/comments";
import { DashboardCommentsClient } from "@/components/dashboard/comments-client";
import { MessageSquare } from "lucide-react";
import type { CommentWithContextConnectionResult } from "@/types";

interface MyCommentsResult {
  myComments: CommentWithContextConnectionResult;
}

export default async function DashboardCommentsPage() {
  let initialData: CommentWithContextConnectionResult = { items: [], total: 0 };

  try {
    const client = await getServerClient();
    const data = await client.request<MyCommentsResult>(GET_MY_COMMENTS, {
      limit: 20,
      offset: 0,
    });
    initialData = data.myComments;
  } catch {
    // Render empty state — client component handles errors
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-amber-500" />
        <div>
          <h1 className="font-serif text-headline-xl font-bold">My Comments</h1>
          <p className="text-caption text-muted-foreground mt-0.5">
            {initialData.total} comment{initialData.total !== 1 ? "s" : ""}{" "}
            across all articles
          </p>
        </div>
      </div>

      <DashboardCommentsClient
        initialComments={initialData.items}
        initialTotal={initialData.total}
      />
    </div>
  );
}
