// apps/api/src/graphql/resolvers/like.resolver.ts
import { builder }      from '../builder.js';
import {
  findLike,
  createLike,
  deleteLike,
  countLikes,
}                       from '../../queries/like.queries.js';
import '../typedefs/like.typedef.js';
import { ToggleLikeResultType } from '../typedefs/like.typedef.js';
import { GraphQLError }         from 'graphql';
import { ApiError }             from '../../middleware/errorHandler.middleware.js';
import { logger }               from '../../helpers/logger.js';

builder.mutationField('toggleLike', (t) =>
  t.field({
    type: ToggleLikeResultType,
    authScopes: { authenticated: true },
    args: { articleId: t.arg.string({ required: true }) },
    resolve: async (_parent, { articleId }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      const userId = ctx.currentUser.id;

      try {
        const existing = await findLike(userId, articleId);
        if (existing) {
          await deleteLike(userId, articleId);
          const likeCount = await countLikes(articleId);
          return { liked: false, likeCount };
        }
        await createLike(userId, articleId);
        const likeCount = await countLikes(articleId);
        return { liked: true, likeCount };
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('toggleLike mutation failed', { userId, articleId, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to toggle like. Please try again.');
      }
    },
  }),
);