"use client";

import { useState, useOptimistic } from "react";
import { GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { CREATE_COMMENT, DELETE_COMMENT } from "@/lib/graphql/queries/comments";
import { AuthorAvatar } from "@/components/ui/author-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatRelativeDate } from "@/lib/utils";
import type { CommentType } from "@/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

interface CommentsSectionProps {
  articleId: string;
  initialComments: CommentType[];
  initialTotal: number;
}

export function CommentsSection({
  articleId,
  initialComments,
  initialTotal,
}: CommentsSectionProps) {
  const { user, isAuthenticated } = useCurrentUser();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [total, setTotal] = useState(initialTotal);

  const getAuthClient = () => {
    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("access_token="))
      ?.split("=")[1];

    return new GraphQLClient(`${API_URL}/graphql`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    if (!isAuthenticated) {
      toast.error("Please sign in to comment");
      return;
    }

    setSubmitting(true);
    try {
      const client = getAuthClient();
      const data = await client.request<{
        createComment: {
          id: string;
          body: string;
          createdAt: string;
          author: { id: string; name: string; avatar: string | null };
        };
      }>(CREATE_COMMENT, { input: { articleId, body: body.trim() } });

      const newComment: CommentType = {
        ...data.createComment,
        updatedAt: data.createComment.createdAt,
      };

      setComments((prev) => [newComment, ...prev]);
      setTotal((prev) => prev + 1);
      setBody("");
      toast.success("Comment posted!");
    } catch {
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      const client = getAuthClient();
      await client.request(DELETE_COMMENT, { id: commentId });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((prev) => prev - 1);
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <section className="mt-10">
      <div className="border-t-2 border-foreground mb-6 pt-4">
        <h2 className="font-serif text-headline font-bold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-amber-500" />
          Comments ({total})
        </h2>
      </div>

      {/* Comment form */}
      {isAuthenticated && user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <AuthorAvatar author={user} size="sm" className="mt-1 shrink-0" />
            <div className="flex-1 space-y-2">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="resize-none"
                maxLength={2000}
              />
              <div className="flex justify-between items-center">
                <span className="text-caption text-muted-foreground">
                  {body.length}/2000
                </span>
                <Button
                  type="submit"
                  variant="amber"
                  size="sm"
                  disabled={submitting || !body.trim()}
                  className="gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 rounded-lg border border-dashed border-border text-center">
          <p className="text-body-sm text-muted-foreground mb-3">
            Sign in to join the conversation
          </p>
          <Button variant="amber" size="sm" asChild>
            <a href="/login">Sign In</a>
          </Button>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-body-sm text-muted-foreground text-center py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <AuthorAvatar
                author={comment.author}
                size="sm"
                className="mt-0.5 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-semibold">
                      {comment.author.name}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {formatRelativeDate(comment.createdAt)}
                    </span>
                  </div>
                  {user?.id === comment.author.id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-body-sm text-foreground leading-relaxed">
                  {comment.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
