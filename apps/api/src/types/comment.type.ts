import { z } from 'zod';
import type { CommentSelect } from '../db/schema/index.js';
import type { PublicUser } from './user.type.js';

export type CommentRow = CommentSelect;

/**
 * Shape returned to GraphQL resolvers — comment with author resolved.
 */
export type CommentWithAuthor = CommentRow & {
  author: Pick<PublicUser, 'id' | 'name' | 'avatar'>;
};

/**
 * Extended shape for admin/dashboard — includes article info.
 */
export type CommentWithContext = CommentRow & {
  author: Pick<PublicUser, 'id' | 'name' | 'avatar'>;
  article: { id: string; title: string; slug: string };
};

export const CreateCommentSchema = z.object({
  articleId: z.string().uuid('Invalid article ID'),
  body: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment cannot exceed 2000 characters')
    .trim(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

export const UpdateCommentSchema = z.object({
  body: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment cannot exceed 2000 characters')
    .trim(),
});

export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;