"use client";

import { useState } from "react";
import Link from "next/link";
import { GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import { MessageSquare, ExternalLink, Trash2, Calendar } from "lucide-react";
import { DELETE_COMMENT } from "@/lib/graphql/queries/comments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatRelativeDate, truncate } from "@/lib/utils";

interface MyComment {
  id: string;
  body: string;
  articleId: string;
  createdAt: string;
}

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

interface DashboardCommentsClientProps {
  initialComments: MyComment[];
}

export function DashboardCommentsClient({
  initialComments,
}: DashboardCommentsClientProps) {
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
    const deletePromise = async () => {
      const client = getAuthClient();
      await client.request(DELETE_COMMENT, { id: deleteId });
      setComments((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteId(null);
    };
    toast.promise(deletePromise(), {
      loading: "Deleting comment…",
      success: "Comment deleted.",
      error: "Failed to delete comment.",
    });
    setLoading(false);
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-serif font-semibold text-body mb-2">
          No comments yet
        </h3>
        <p className="text-body-sm text-muted-foreground max-w-xs mx-auto">
          Your comments on articles will appear here. Join the conversation on
          any article.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="group p-4 rounded-lg border border-border bg-card shadow-card hover:shadow-editorial transition-shadow"
          >
            <p className="text-body-sm text-foreground leading-relaxed mb-3">
              {comment.body}
            </p>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formatRelativeDate(comment.createdAt)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/articles/`}
                  className="flex items-center gap-1 text-caption text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                  title="View article"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">View article</span>
                </Link>
                <button
                  onClick={() => setDeleteId(comment.id)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete comment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-caption text-muted-foreground text-center mt-6">
        To edit a comment, visit the article and update it directly in the
        comments section.
      </p>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting…" : "Delete Comment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
