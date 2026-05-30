// apps/web/src/components/admin/comments-moderation.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import {
  MessageSquare,
  Trash2,
  ExternalLink,
  ChevronDown,
  Search,
  User,
} from "lucide-react";
import {
  DELETE_COMMENT,
  GET_ALL_COMMENTS,
} from "@/lib/graphql/queries/comments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthorAvatar } from "@/components/ui/author-avatar";
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

interface AdminCommentsClientProps {
  initialComments: CommentWithContextType[];
  initialTotal: number;
}

export function AdminCommentsClient({
  initialComments,
  initialTotal,
}: AdminCommentsClientProps) {
  const [comments, setComments] = useState(initialComments);
  const [total, setTotal] = useState(initialTotal);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");

  const hasMore = comments.length < total;

  const filtered = search.trim()
    ? comments.filter(
        (c) =>
          c.body.toLowerCase().includes(search.toLowerCase()) ||
          c.author.name.toLowerCase().includes(search.toLowerCase()) ||
          c.article.title.toLowerCase().includes(search.toLowerCase()),
      )
    : comments;

  // ── Delete ────────────────────────────────────────────────────
  const deleteComment = async (id: string) => {
    if (!confirm("Permanently delete this comment?")) return;
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
        allComments: { items: CommentWithContextType[]; total: number };
      }>(GET_ALL_COMMENTS, { limit: 30, offset: comments.length });
      setComments((prev) => [...prev, ...data.allComments.items]);
      setTotal(data.allComments.total);
    } catch {
      toast.error("Failed to load more comments");
    } finally {
      setLoadingMore(false);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-serif font-semibold text-body mb-2">
          No comments yet
        </h3>
        <p className="text-body-sm text-muted-foreground max-w-sm mx-auto">
          Comments posted by readers will appear here for moderation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by comment content, author, or article…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-caption text-muted-foreground px-1">
        <span>
          Showing {filtered.length} of {total} comments
          {search && ` matching "${search}"`}
        </span>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="hover:text-foreground transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 border rounded-lg border-dashed border-border">
            <p className="text-body-sm text-muted-foreground">
              No comments match your search.
            </p>
          </div>
        ) : (
          filtered.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                "rounded-lg border border-border bg-card p-4 shadow-card transition-opacity",
                deletingId === comment.id && "opacity-40 pointer-events-none",
              )}
            >
              <div className="flex gap-3">
                {/* Author avatar */}
                <AuthorAvatar
                  author={comment.author}
                  size="sm"
                  className="shrink-0 mt-0.5"
                />

                <div className="flex-1 min-w-0">
                  {/* Author + meta */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-body-sm font-semibold">
                          {comment.author.name}
                        </span>
                        <span className="text-caption text-muted-foreground">
                          {formatRelativeDate(comment.createdAt)}
                        </span>
                        {comment.updatedAt !== comment.createdAt && (
                          <span className="text-[0.6rem] text-muted-foreground italic">
                            (edited)
                          </span>
                        )}
                      </div>
                      {/* Article link */}
                      <Link
                        href={`/articles/${comment.article.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-caption text-amber-700 dark:text-amber-400 hover:underline mt-0.5"
                      >
                        <span className="line-clamp-1 max-w-xs">
                          {comment.article.title}
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </Link>
                    </div>

                    {/* Delete action */}
                    <button
                      onClick={() => deleteComment(comment.id)}
                      disabled={deletingId === comment.id}
                      className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Comment body */}
                  <p className="text-body-sm text-foreground leading-relaxed whitespace-pre-wrap break-words bg-muted/30 rounded-md px-3 py-2">
                    {comment.body}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && !search && (
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
                Load more comments
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
