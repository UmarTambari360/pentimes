import { builder } from '../builder.js';
import type {
  CommentWithAuthor,
  CommentWithContext,
} from '../../types/comment.type.ts';

// ── Comment Author (embedded)
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

// ── Comment Article Context (for admin/dashboard) ─────────────────
export const CommentArticleContextType = builder
  .objectRef<{
    id: string;
    title: string;
    slug: string;
  }>('CommentArticleContext')
  .implement({
    fields: (t) => ({
      id: t.exposeString('id'),
      title: t.exposeString('title'),
      slug: t.exposeString('slug'),
    }),
  });

// ── Core Comment Type ─────────────────────────────────────────────
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

// ── Comment With Context (includes article — for admin/user pages) ─
export const CommentWithContextType = builder
  .objectRef<CommentWithContext>('CommentWithContext')
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

      article: t.field({
        type: CommentArticleContextType,
        resolve: (c) => c.article,
      }),
    }),
  });

// ── Comment Connection (paginated) ────────────────────────────────
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

// ── Comment With Context Connection ──────────────────────────────
export const CommentWithContextConnectionType = builder
  .objectRef<{
    items: CommentWithContext[];
    total: number;
  }>('CommentWithContextConnection')
  .implement({
    fields: (t) => ({
      items: t.field({
        type: [CommentWithContextType],
        resolve: (c) => c.items,
      }),
      total: t.exposeInt('total'),
    }),
  });