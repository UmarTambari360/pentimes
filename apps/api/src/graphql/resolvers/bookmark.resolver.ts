// apps/api/src/graphql/resolvers/bookmark.resolver.ts
import { builder }      from '../builder.js';
import {
  findBookmark,
  createBookmark,
  deleteBookmark,
  findBookmarksByUser,
}                       from '../../queries/bookmark.queries.js';
import '../typedefs/bookmark.typedef.js';
import '../typedefs/article.typedef.js';
import { ToggleBookmarkResultType } from '../typedefs/bookmark.typedef.js';
import { ArticleType }              from '../typedefs/article.typedef.js';
import { GraphQLError }             from 'graphql';
import { ApiError }                 from '../../middleware/errorHandler.middleware.js';
import { logger }                   from '../../helpers/logger.js';

builder.mutationField('toggleBookmark', (t) =>
  t.field({
    type: ToggleBookmarkResultType,
    authScopes: { authenticated: true },
    args: { articleId: t.arg.string({ required: true }) },
    resolve: async (_parent, { articleId }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      const userId = ctx.currentUser.id;

      try {
        const existing = await findBookmark(userId, articleId);
        if (existing) {
          await deleteBookmark(userId, articleId);
          return { bookmarked: false };
        }
        await createBookmark(userId, articleId);
        return { bookmarked: true };
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('toggleBookmark mutation failed', { userId, articleId, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to toggle bookmark. Please try again.');
      }
    },
  }),
);

builder.queryField('myBookmarks', (t) =>
  t.field({
    type: [ArticleType],
    authScopes: { authenticated: true },
    args: {
      limit:  t.arg.int({ required: false, defaultValue: 20 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_parent, { limit, offset }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');

      try {
        const bookmarks = await findBookmarksByUser(
          ctx.currentUser.id,
          limit  ?? 20,
          offset ?? 0,
        );
        const result = bookmarks.map((b) => {
          const a = b.article as Record<string, unknown>;
          return {
            ...a,
            coverImage:               a['coverImage']  ?? null,
            excerpt:                  a['excerpt']     ?? null,
            publishedAt:              a['publishedAt'] ?? null,
            likeCount:                0,
            commentCount:             0,
            isLikedByCurrentUser:     null,
            isBookmarkedByCurrentUser: true,
            categories: Array.isArray(a['articleCategories'])
              ? (a['articleCategories'] as Array<{ category: unknown }>).map((ac) => ac.category)
              : [],
          };
        });
        return result as unknown as any;
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('myBookmarks query failed', { userId: ctx.currentUser.id, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to fetch bookmarks.');
      }
    },
  }),
);