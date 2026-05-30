import { builder } from '../builder.js';
import type { CommentWithAuthor } from '../../types/comment.type.ts';

export const CommentAuthorType = builder
  .objectRef<{
    id: string;
    name: string;
    avatar: string | null;
  }>('CommentAuthor')
  .implement({
    fields: (t) => ({
      id: t.exposeString('id'),
      name: t.exposeString('name'),
      avatar: t.exposeString('avatar', { nullable: true }),
    }),
  });

export const CommentType = builder
  .objectRef<CommentWithAuthor>('Comment')
  .implement({
    fields: (t) => ({
      id: t.exposeString('id'),
      body: t.exposeString('body'),
      articleId: t.exposeString('articleId'),
      createdAt: t.field({
        type: 'String',
        resolve: (c) => c.createdAt.toISOString(),
      }),
      updatedAt: t.field({
        type: 'String',
        resolve: (c) => c.updatedAt.toISOString(),
      }),
      author: t.field({
        type: CommentAuthorType,
        resolve: (c) => c.author,
      }),
    }),
  });

export const CommentConnectionType = builder
  .objectRef<{
    items: CommentWithAuthor[];
    total: number;
  }>('CommentConnection')
  .implement({
    fields: (t) => ({
      items: t.field({ type: [CommentType], resolve: (c) => c.items }),
      total: t.exposeInt('total'),
    }),
  });

// Admin-specific comment type with article context
export type AdminComment = CommentWithAuthor & {
  articleTitle: string;
  articleSlug: string;
};

export const AdminCommentType = builder
  .objectRef<AdminComment>('AdminComment')
  .implement({
    fields: (t) => ({
      id: t.exposeString('id'),
      body: t.exposeString('body'),
      articleId: t.exposeString('articleId'),
      articleTitle: t.exposeString('articleTitle'),
      articleSlug: t.exposeString('articleSlug'),
      createdAt: t.field({
        type: 'String',
        resolve: (c) => c.createdAt.toISOString(),
      }),
      updatedAt: t.field({
        type: 'String',
        resolve: (c) => c.updatedAt.toISOString(),
      }),
      author: t.field({
        type: CommentAuthorType,
        resolve: (c) => c.author,
      }),
    }),
  });

export const AdminCommentConnectionType = builder
  .objectRef<{
    items: AdminComment[];
    total: number;
  }>('AdminCommentConnection')
  .implement({
    fields: (t) => ({
      items: t.field({ type: [AdminCommentType], resolve: (c) => c.items }),
      total: t.exposeInt('total'),
    }),
  });