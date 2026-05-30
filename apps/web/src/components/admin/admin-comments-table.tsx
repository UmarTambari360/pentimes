"use client";

import { useState } from "react";
import Link from "next/link";
import { GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import { Trash2, ExternalLink, MessageSquare } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AuthorAvatar } from "@/components/ui/author-avatar";
import { Pagination } from "@/components/public/pagination";
import { DELETE_COMMENT } from "@/lib/graphql/queries/comments";
import { formatRelativeDate } from "@/lib/utils";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

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

interface AdminCommentsTableProps {
  comments: AdminComment[];
  total: number;
  limit: number;
  offset: number;
}

export function AdminCommentsTable({
  comments: initialComments,
  total,
  limit,
  offset,
}: AdminCommentsTableProps) {
  const [comments, setComments] = useState(initialComments);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getAuthClient = () => {
    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("access_token="))
      ?.split("=")[1];
    return new GraphQLClient(`${API_URL}/graphql`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const client = getAuthClient();
      await client.request(DELETE_COMMENT, { id: deleteId });
      setComments((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Comment deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setLoading(false);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg border-dashed border-border">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-body-sm text-muted-foreground">No comments yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comment</TableHead>
              <TableHead className="hidden md:table-cell">Author</TableHead>
              <TableHead className="hidden sm:table-cell">Article</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.map((comment) => (
              <TableRow key={comment.id}>
                <TableCell>
                  <p className="text-body-sm line-clamp-2">{comment.body}</p>
                  <div className="flex items-center gap-2 sm:hidden mt-1">
                    <span className="text-caption text-muted-foreground">
                      by {comment.author.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <AuthorAvatar author={comment.author} size="xs" showName />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Link
                    href={`/articles/${comment.articleSlug}`}
                    target="_blank"
                    className="text-body-sm text-amber-700 hover:underline flex items-center gap-1 line-clamp-1"
                  >
                    {comment.articleTitle}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </Link>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-caption text-muted-foreground">
                  {formatRelativeDate(comment.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteId(comment.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination total={total} limit={limit} offset={offset} />

      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              This will permanently delete the comment. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Comment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
