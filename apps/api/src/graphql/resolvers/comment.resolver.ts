// apps/api/src/graphql/resolvers/comment.resolver.ts
import { builder } from '../builder.js';
import {
  findCommentsByArticle,
  findCommentsByUser,
  findCommentById,
  createComment,
  updateComment,
  deleteComment,
} from '../../queries/comment.queries.js';
import { cacheService }       from '../../services/redis.service.js';
import { CreateCommentInput } from '../inputs.js';
import '../typedefs/comment.typedef.js';
import { CommentType, CommentConnectionType } from '../typedefs/comment.typedef.js';
import { GraphQLError }                       from 'graphql';
import { ApiError }                           from '../../middleware/errorHandler.middleware.js';
import { logger }                             from '../../helpers/logger.js';

builder.queryField('comments', (t) =>
  t.field({
    type: CommentConnectionType,
    args: {
      articleId: t.arg.string({ required: true }),
      limit:     t.arg.int({ required: false, defaultValue: 20 }),
      offset:    t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_parent, { articleId, limit, offset }) => {
      try {
        const { items, total } = await findCommentsByArticle(articleId, limit ?? 20, offset ?? 0);
        return { items: items.map((c) => ({ ...c, author: c.user })), total };
      } catch (err) {
        logger.error('comments query failed', { articleId, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to fetch comments.');
      }
    },
  }),
);

builder.queryField('myComments', (t) =>
  t.field({
    type: [CommentType],
    authScopes: { authenticated: true },
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      try {
        const rows = await findCommentsByUser(ctx.currentUser.id);
        return rows.items.map((c) => ({ ...c, author: c.user }));
      } catch (err) {
        logger.error('myComments query failed', { userId: ctx.currentUser.id, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to fetch your comments.');
      }
    },
  }),
);

builder.mutationField('createComment', (t) =>
  t.field({
    type: CommentType,
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: CreateCommentInput, required: true }) },
    resolve: async (_parent, { input }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      try {
        const comment = await createComment({
          body:      input.body,
          userId:    ctx.currentUser.id,
          articleId: input.articleId,
        });
        await cacheService.invalidateArticleCache().catch((err) => {
          logger.warn('Cache invalidation failed after createComment', { error: err instanceof Error ? err.message : String(err) });
        });
        return { ...comment, author: comment.user };
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('createComment mutation failed', { userId: ctx.currentUser.id, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to post comment. Please try again.');
      }
    },
  }),
);

builder.mutationField('updateComment', (t) =>
  t.field({
    type: CommentType,
    authScopes: { authenticated: true },
    args: {
      id:   t.arg.string({ required: true }),
      body: t.arg.string({ required: true }),
    },
    resolve: async (_parent, { id, body }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      try {
        const existing = await findCommentById(id);
        if (!existing) throw new GraphQLError('Comment not found.');
        if (existing.userId !== ctx.currentUser.id && ctx.currentUser.role !== 'admin') {
          throw new GraphQLError('You can only edit your own comments.');
        }
        const updated = await updateComment(id, body);
        if (!updated) throw new GraphQLError('Failed to update comment.');
        return { ...updated, author: updated.user };
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('updateComment mutation failed', { commentId: id, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to update comment. Please try again.');
      }
    },
  }),
);

builder.mutationField('deleteComment', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_parent, { id }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      try {
        const existing = await findCommentById(id);
        if (!existing) throw new GraphQLError('Comment not found.');
        if (existing.userId !== ctx.currentUser.id && ctx.currentUser.role !== 'admin') {
          throw new GraphQLError('You can only delete your own comments.');
        }
        return await deleteComment(id);
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('deleteComment mutation failed', { commentId: id, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to delete comment. Please try again.');
      }
    },
  }),
);