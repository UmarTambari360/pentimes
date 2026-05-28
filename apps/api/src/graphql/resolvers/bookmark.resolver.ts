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

builder.mutationField('toggleBookmark', (t) =>
  t.field({
    type: ToggleBookmarkResultType,
    authScopes: { authenticated: true },
    args: { articleId: t.arg.string({ required: true }) },
    resolve: async (_parent, { articleId }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      const userId = ctx.currentUser.id;   // ← Changed from .sub

      const existing = await findBookmark(userId, articleId);
      if (existing) {
        await deleteBookmark(userId, articleId);
        return { bookmarked: false };
      }

      await createBookmark(userId, articleId);
      return { bookmarked: true };
    },
  })
);

builder.queryField('myBookmarks', (t) =>
  t.field({
    type: [ArticleType],
    authScopes: { authenticated: true },
    args: {
      limit: t.arg.int({ required: false, defaultValue: 20 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_parent, { limit, offset }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      const bookmarks = await findBookmarksByUser(ctx.currentUser.id, limit ?? 20, offset ?? 0); // ← Changed from .sub
      return bookmarks.map((b) => {
        const a = b.article as any;
        return {
          ...a,
          coverImage: a.coverImage ?? null,
          excerpt: a.excerpt ?? null,
          publishedAt: a.publishedAt ?? null,
          likeCount: 0,
          commentCount: 0,
          isLikedByCurrentUser: null,      // ← Fixed field name
          isBookmarkedByCurrentUser: true, // ← Fixed field name
          categories: a.articleCategories?.map((ac: any) => ac.category) || [], // ← Added missing categories
        };
      });
    },
  })
);