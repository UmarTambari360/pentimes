// apps/web/src/components/dashboard/comments-client.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import {
  MessageSquare,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import {
  UPDATE_COMMENT,
  DELETE_COMMENT,
  GET_MY_COMMENTS,
} from "@/lib/graphql/queries/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CommentWithContextType } from "@/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

function getAuthClient() {
  const token = document.cookie
    .split("; ")
    .find((r) => r.startsWith("access_token="))
    ?.split("=")[1];
  return new GraphQLClient(`${API_URL}/graphql`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

interface DashboardCommentsClientProps {
  initialComments: CommentWithContextType[];
  initialTotal: number;
}

export function DashboardCommentsClient({
  initialComments,
  initialTotal,
}: DashboardCommentsClientProps) {
  const [comments, setComments] = useState(initialComments);
  const [total, setTotal] = useState(initialTotal);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasMore = comments.length < total;

  // ── Edit ──────────────────────────────────────────────────────
  const startEdit = (comment: CommentWithContextType) => {
    setEditingId(comment.id);
    setEditBody(comment.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditBody("");
  };

  const saveEdit = async (id: string) => {
    if (!editBody.trim()) return;
    setSavingId(id);
    try {
      const client = getAuthClient();
      const data = await client.request<{
        updateComment: { id: string; body: string; updatedAt: string };
      }>(UPDATE_COMMENT, { id, body: editBody.trim() });
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                body: data.updateComment.body,
                updatedAt: data.updateComment.updatedAt,
              }
            : c,
        ),
      );
      setEditingId(null);
      toast.success("Comment updated!");
    } catch {
      toast.error("Failed to update comment");
    } finally {
      setSavingId(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const deleteComment = async (id: string) => {
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const client = getAuthClient();
      await client.request(DELETE_COMMENT, { id });
      setComments((prev) => prev.filter((c) => c.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Load more ─────────────────────────────────────────────────
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const client = getAuthClient();
      const data = await client.request<{
        myComments: { items: CommentWithContextType[]; total: number };
      }>(GET_MY_COMMENTS, { limit: 20, offset: comments.length });
      setComments((prev) => [...prev, ...data.myComments.items]);
      setTotal(data.myComments.total);
    } catch {
      toast.error("Failed to load more comments");
    } finally {
      setLoadingMore(false);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg border-dashed border-border">
        <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-body-sm text-muted-foreground">No comments yet.</p>
        <p className="text-caption text-muted-foreground mt-1">
          Comments you post on articles will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => {
        const isEditing = editingId === comment.id;
        const isDeleting = deletingId === comment.id;
        const isSaving = savingId === comment.id;

        return (
          <div
            key={comment.id}
            className={cn(
              "p-4 rounded-lg border border-border bg-card shadow-card transition-opacity",
              isDeleting && "opacity-40 pointer-events-none",
            )}
          >
            {/* Article context */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <Link
                href={`/articles/${comment.article.slug}`}
                className="text-caption font-semibold text-amber-700 dark:text-amber-400 hover:underline underline-offset-2 line-clamp-1 flex-1"
              >
                {comment.article.title}
              </Link>
              <Link
                href={`/articles/${comment.article.slug}`}
                target="_blank"
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title="View article"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Comment body or edit form */}
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
                  className="resize-none text-body-sm"
                  maxLength={2000}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") cancelEdit();
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                      saveEdit(comment.id);
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="amber"
                    onClick={() => saveEdit(comment.id)}
                    disabled={isSaving || !editBody.trim()}
                    className="gap-1.5 h-7 text-caption"
                  >
                    <Check className="h-3 w-3" />
                    {isSaving ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEdit}
                    className="gap-1.5 h-7 text-caption"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-body-sm text-foreground mb-3 leading-relaxed whitespace-pre-wrap break-words">
                {comment.body}
              </p>
            )}

            {/* Footer */}
            {!isEditing && (
              <div className="flex items-center justify-between text-caption text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>{formatRelativeDate(comment.createdAt)}</span>
                  {comment.updatedAt !== comment.createdAt && (
                    <span className="italic text-[0.6rem]">(edited)</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(comment)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Load more */}
      {hasMore && (
        <div className="pt-2 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
            className="gap-2"
          >
            {loadingMore ? (
              <>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                Loading…
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Load more
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
