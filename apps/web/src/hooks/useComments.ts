// apps/web/src/hooks/useComments.ts
'use client';

import { useState, useCallback, useOptimistic, useTransition } from 'react';
import { GraphQLClient } from 'graphql-request';
import { toast } from 'sonner';
import {
  CREATE_COMMENT,
  UPDATE_COMMENT,
  DELETE_COMMENT,
} from '@/lib/graphql/queries/comments';
import type { CommentType } from '@/types';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

function getAuthClient(): GraphQLClient {
  const token = document.cookie
    .split('; ')
    .find((r) => r.startsWith('access_token='))
    ?.split('=')[1];
  return new GraphQLClient(`${API_URL}/graphql`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

type OptimisticAction =
  | { type: 'ADD'; comment: CommentType }
  | { type: 'UPDATE'; id: string; body: string }
  | { type: 'DELETE'; id: string };

function commentsReducer(
  state: CommentType[],
  action: OptimisticAction
): CommentType[] {
  switch (action.type) {
    case 'ADD':
      return [action.comment, ...state];
    case 'UPDATE':
      return state.map((c) =>
        c.id === action.id ? { ...c, body: action.body } : c
      );
    case 'DELETE':
      return state.filter((c) => c.id !== action.id);
    default:
      return state;
  }
}

interface UseCommentsOptions {
  articleId: string;
  initialComments: CommentType[];
  initialTotal: number;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function useComments({
  articleId,
  initialComments,
  initialTotal,
  currentUserId,
  isAdmin = false,
}: UseCommentsOptions) {
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [total, setTotal] = useState(initialTotal);
  const [optimisticComments, dispatchOptimistic] = useOptimistic(
    comments,
    commentsReducer
  );
  const [isPending, startTransition] = useTransition();

  // ── Add comment (optimistic) ──────────────────────────────────
  const addComment = useCallback(
    async (body: string, currentUser: { id: string; name: string; avatar: string | null }) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticComment: CommentType = {
        id: tempId,
        body,
        articleId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: currentUser,
      };

      startTransition(() => {
        dispatchOptimistic({ type: 'ADD', comment: optimisticComment });
      });

      const promise = getAuthClient()
        .request<{ createComment: CommentType }>(CREATE_COMMENT, {
          input: { articleId, body },
        })
        .then((data) => {
          // Replace the temp comment with the real one
          setComments((prev) => {
            const withoutTemp = prev.filter((c) => c.id !== tempId);
            return [data.createComment, ...withoutTemp];
          });
          setTotal((t) => t + 1);
          return data.createComment;
        })
        .catch((err) => {
          // Remove the optimistic comment on failure
          setComments((prev) => prev.filter((c) => c.id !== tempId));
          throw err;
        });

      toast.promise(promise, {
        loading: 'Posting comment…',
        success: 'Comment posted!',
        error: 'Failed to post comment. Please try again.',
      });

      return promise;
    },
    [articleId, dispatchOptimistic]
  );

  // ── Edit comment (optimistic) ────────────────────────────────
  const editComment = useCallback(
    async (id: string, body: string) => {
      const original = comments.find((c) => c.id === id);
      if (!original) return;

      startTransition(() => {
        dispatchOptimistic({ type: 'UPDATE', id, body });
      });

      const promise = getAuthClient()
        .request<{ updateComment: CommentType }>(UPDATE_COMMENT, { id, body })
        .then((data) => {
          setComments((prev) =>
            prev.map((c) => (c.id === id ? data.updateComment : c))
          );
          return data.updateComment;
        })
        .catch((err) => {
          // Revert on error
          setComments((prev) =>
            prev.map((c) => (c.id === id ? original : c))
          );
          throw err;
        });

      toast.promise(promise, {
        loading: 'Saving edit…',
        success: 'Comment updated!',
        error: 'Failed to update comment.',
      });

      return promise;
    },
    [comments, dispatchOptimistic]
  );

  // ── Delete comment (optimistic) ───────────────────────────────
  const removeComment = useCallback(
    async (id: string) => {
      const original = [...comments];

      startTransition(() => {
        dispatchOptimistic({ type: 'DELETE', id });
      });

      const promise = getAuthClient()
        .request<{ deleteComment: boolean }>(DELETE_COMMENT, { id })
        .then((data) => {
          if (data.deleteComment) {
            setComments((prev) => prev.filter((c) => c.id !== id));
            setTotal((t) => Math.max(0, t - 1));
          }
          return data.deleteComment;
        })
        .catch((err) => {
          // Revert on error
          setComments(original);
          throw err;
        });

      toast.promise(promise, {
        loading: 'Deleting comment…',
        success: 'Comment deleted.',
        error: 'Failed to delete comment.',
      });

      return promise;
    },
    [comments, dispatchOptimistic]
  );

  const canEdit = useCallback(
    (commentAuthorId: string) =>
      isAdmin || commentAuthorId === currentUserId,
    [isAdmin, currentUserId]
  );

  return {
    comments: optimisticComments,
    total,
    isPending,
    addComment,
    editComment,
    removeComment,
    canEdit,
  };
}