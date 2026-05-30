import { builder } from '../builder.js';
import {
  findCommentsByArticle,
  findCommentsByUser,
  findAllComments,
  findCommentById,
  createComment,
  updateComment,
  deleteComment,
} from '../../queries/comment.queries.js';
import { cacheService } from '../../services/redis.service.js';
import { CreateCommentInput } from '../inputs.js';
import '../typedefs/comment.typedef.js';
import { CommentType, CommentConnectionType } from '../typedefs/comment.typedef.js';
import { AdminCommentConnectionType } from '../typedefs/comment.typedef.js';
import { GraphQLError } from 'graphql';

builder.queryField('comments', (t) =>
  t.field({
    type: CommentConnectionType,
    args: {
      articleId: t.arg.string({ required: true }),
      limit: t.arg.int({ required: false, defaultValue: 20 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_parent, { articleId, limit, offset }) => {
      const { items, total } = await findCommentsByArticle(articleId, limit ?? 20, offset ?? 0);
      return {
        items: items.map((c) => ({ ...c, author: c.user })),
        total,
      };
    },
  })
);

builder.queryField('myComments', (t) =>
  t.field({
    type: [CommentType],
    authScopes: { authenticated: true },
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      const rows = await findCommentsByUser(ctx.currentUser.id);
      return rows.map((c) => ({ ...c, author: c.user }));
    },
  })
);

builder.queryField('allComments', (t) =>
  t.field({
    type: AdminCommentConnectionType,
    authScopes: { role: 'admin' },
    args: {
      limit: t.arg.int({ required: false, defaultValue: 20 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_parent, { limit, offset }) => {
      const { items, total } = await findAllComments(limit ?? 20, offset ?? 0);
      return {
        items: items.map((c) => ({
          ...c,
          author: c.user,
          articleTitle: (c.article as any)?.title ?? '',
          articleSlug: (c.article as any)?.slug ?? '',
        })),
        total,
      };
    },
  })
);

builder.mutationField('createComment', (t) =>
  t.field({
    type: CommentType,
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: CreateCommentInput, required: true }) },
    resolve: async (_parent, { input }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      const comment = await createComment({
        body: input.body,
        userId: ctx.currentUser.id,
        articleId: input.articleId,
      });
      await cacheService.invalidateArticleCache();
      return { ...comment, author: comment.user };
    },
  })
);

builder.mutationField('updateComment', (t) =>
  t.field({
    type: CommentType,
    authScopes: { authenticated: true },
    args: {
      id: t.arg.string({ required: true }),
      body: t.arg.string({ required: true }),
    },
    resolve: async (_parent, { id, body }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      const existing = await findCommentById(id);
      if (!existing) throw new GraphQLError('Comment not found');
      if (existing.userId !== ctx.currentUser.id && ctx.currentUser.role !== 'admin') {
        throw new GraphQLError('You can only edit your own comments');
      }
      const updated = await updateComment(id, body);
      if (!updated) throw new GraphQLError('Failed to update comment');
      return { ...updated, author: updated.user };
    },
  })
);

builder.mutationField('deleteComment', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_parent, { id }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      const existing = await findCommentById(id);
      if (!existing) throw new GraphQLError('Comment not found');
      if (existing.userId !== ctx.currentUser.id && ctx.currentUser.role !== 'admin') {
        throw new GraphQLError('You can only delete your own comments');
      }
      return deleteComment(id);
    },
  })
);