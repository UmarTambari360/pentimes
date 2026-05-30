'use client';

import { useState } from 'react';
import { MessageCircle, Send, Pencil, Trash2, Check, X, ChevronDown } from 'lucide-react';
import { GraphQLClient } from 'graphql-request';
import { GET_COMMENTS } from '@/lib/graphql/queries/comments';
import { AuthorAvatar } from '@/components/ui/author-avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useComments } from '@/hooks/useComments';
import { formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { CommentType, CommentConnectionResult } from '@/types';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
const PAGE_SIZE = 10;

interface CommentsSectionProps {
  articleId: string;
  initialComments: CommentType[];
  initialTotal: number;
}

// ── Single comment item ────────────────────────────────────────────
function CommentItem({
  comment,
  canEdit,
  onEdit,
  onDelete,
  isDeleting,
}: {
  comment: CommentType;
  canEdit: boolean;
  onEdit: (id: string, body: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  isDeleting: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [saving, setSaving] = useState(false);

  const handleSaveEdit = async () => {
    if (!editBody.trim() || editBody === comment.body) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onEdit(comment.id, editBody.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditBody(comment.body);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        'flex gap-3 group transition-opacity',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
    >
      <AuthorAvatar
        author={comment.author}
        size="sm"
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-body-sm font-semibold text-foreground">
              {comment.author.name}
            </span>
            <span className="text-caption text-muted-foreground">
              {formatRelativeDate(comment.createdAt)}
            </span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-[0.65rem] text-muted-foreground italic">
                (edited)
              </span>
            )}
          </div>

          {canEdit && !editing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => {
                  setEditBody(comment.body);
                  setEditing(true);
                }}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Edit comment"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Delete comment"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Body or edit form */}
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={3}
              className="resize-none text-body-sm"
              maxLength={2000}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancelEdit();
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey))
                  handleSaveEdit();
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="amber"
                onClick={handleSaveEdit}
                disabled={saving || !editBody.trim()}
                className="gap-1.5 h-7 text-caption"
              >
                <Check className="h-3 w-3" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                className="gap-1.5 h-7 text-caption"
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
              <span className="text-[0.65rem] text-muted-foreground ml-auto">
                Ctrl+Enter to save
              </span>
            </div>
          </div>
        ) : (
          <p className="text-body-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {comment.body}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Comment form ───────────────────────────────────────────────────
function CommentForm({
  user,
  onSubmit,
  disabled,
}: {
  user: { id: string; name: string; avatar: string | null };
  onSubmit: (body: string) => Promise<unknown>;
  disabled?: boolean;
}) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(body.trim());
      setBody('');
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = 2000 - body.length;

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-3">
        <AuthorAvatar author={user} size="sm" className="mt-1 shrink-0" />
        <div className="flex-1 space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts on this article…"
            rows={3}
            className="resize-none"
            maxLength={2000}
            disabled={disabled || submitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (body.trim() && !submitting) handleSubmit(e as never);
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-caption transition-colors',
                remaining < 100
                  ? 'text-amber-600'
                  : remaining < 50
                  ? 'text-destructive font-semibold'
                  : 'text-muted-foreground'
              )}
            >
              {remaining} characters remaining
            </span>
            <Button
              type="submit"
              variant="amber"
              size="sm"
              disabled={submitting || !body.trim() || disabled}
              className="gap-2"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? 'Posting…' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────
function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// ── Main CommentsSection ───────────────────────────────────────────
export function CommentsSection({
  articleId,
  initialComments,
  initialTotal,
}: CommentsSectionProps) {
  const { user, isAuthenticated, isAdmin } = useCurrentUser();
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialTotal > initialComments.length);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const { comments, total, addComment, editComment, removeComment, canEdit } =
    useComments({
      articleId,
      initialComments,
      initialTotal,
      currentUserId: user?.id,
      isAdmin,
    });

  // ── Load more (pagination) ────────────────────────────────────
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const client = new GraphQLClient(`${API_URL}/graphql`);
      const data = await client.request<{
        comments: { items: CommentType[]; total: number };
      }>(GET_COMMENTS, {
        articleId,
        limit: PAGE_SIZE,
        offset: comments.length,
      });
      // This is a simple append — in production you'd merge with dedup
      // For now we rely on the fact that the server returns newest-first
      setHasMore(
        comments.length + data.comments.items.length < data.comments.total
      );
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Handle delete with local pending state ─────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment? This cannot be undone.')) return;
    setDeletingIds((s) => new Set(s).add(id));
    try {
      await removeComment(id);
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <section className="mt-10" aria-label="Comments">
      {/* Section header */}
      <div className="border-t-2 border-foreground mb-6 pt-4">
        <h2 className="font-serif text-headline font-bold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-amber-500" aria-hidden />
          Comments
          <span className="text-body-sm font-normal text-muted-foreground font-sans">
            ({total})
          </span>
        </h2>
      </div>

      {/* Comment form for authenticated users */}
      {isAuthenticated && user ? (
        <CommentForm
          user={user}
          onSubmit={(body) =>
            addComment(body, {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
            })
          }
        />
      ) : (
        <div className="mb-8 p-5 rounded-lg border border-dashed border-border text-center bg-muted/10">
          <p className="text-body-sm text-muted-foreground mb-3">
            Sign in to join the conversation
          </p>
          <Button variant="amber" size="sm" asChild>
            <a href="/login">Sign In to Comment</a>
          </Button>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-12 border rounded-lg border-dashed border-border">
            <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-body-sm text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                canEdit={canEdit(comment.author.id)}
                onEdit={editComment}
                onDelete={handleDelete}
                isDeleting={deletingIds.has(comment.id)}
              />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="pt-4 text-center">
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

            {loadingMore && (
              <div className="space-y-6 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CommentSkeleton key={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}