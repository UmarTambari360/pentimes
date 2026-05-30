import { getServerClient } from "@/lib/graphql/client";
import { GET_ALL_COMMENTS } from "@/lib/graphql/queries/comments";
import { AdminCommentsTable } from "@/components/admin/admin-comments-table";

interface AdminComment {
  id: string;
  body: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface AllCommentsResult {
  allComments: {
    items: AdminComment[];
    total: number;
  };
}

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const { offset: offsetStr } = await searchParams;
  const offset = Number(offsetStr ?? 0);
  const limit = 30;

  let comments: AdminComment[] = [];
  let total = 0;

  try {
    const client = await getServerClient();
    const data = await client.request<AllCommentsResult>(GET_ALL_COMMENTS, {
      limit,
      offset,
    });
    comments = data.allComments.items;
    total = data.allComments.total;
  } catch {}

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-serif text-headline-xl font-bold">
          Comment Moderation
        </h1>
        <p className="text-caption text-muted-foreground mt-1">
          {total} total comments across all articles
        </p>
      </div>
      <AdminCommentsTable
        comments={comments}
        total={total}
        limit={limit}
        offset={offset}
      />
    </div>
  );
}
