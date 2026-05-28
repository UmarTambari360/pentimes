import { builder }                  from '../builder.js';
import './user.typedef.js';
import './category.typedef.js';
import type { ArticleFull }         from '../../types/article.type.ts';
import { AuthorSummaryType }        from './user.typedef.js';
import { CategorySummaryType }      from './category.typedef.js';


// Article Type (Full)
export const ArticleType = builder
  .objectRef<ArticleFull>('Article')
  .implement({
    fields: (t) => ({
      id: t.exposeString('id'),
      title: t.exposeString('title'),
      slug: t.exposeString('slug'),
      excerpt: t.exposeString('excerpt', { nullable: true }),
      content: t.exposeString('content'),
      coverImage: t.exposeString('coverImage', { nullable: true }),
      status: t.exposeString('status'),
      views: t.exposeInt('views'),
      readingTime: t.exposeInt('readingTime'),
      likeCount: t.exposeInt('likeCount'),
      commentCount: t.exposeInt('commentCount'),

      // Computed fields - use .boolean() instead of expose
      isLiked: t.boolean({
        nullable: true,
        resolve: (article) => article.isLikedByCurrentUser ?? null,
      }),

      isBookmarked: t.boolean({
        nullable: true,
        resolve: (article) => article.isBookmarkedByCurrentUser ?? null,
      }),

      publishedAt: t.field({
        type: 'String',
        nullable: true,
        resolve: (article) => article.publishedAt?.toISOString() ?? null,
      }),

      createdAt: t.field({
        type: 'String',
        resolve: (article) => article.createdAt.toISOString(),
      }),

      updatedAt: t.field({
        type: 'String',
        resolve: (article) => article.updatedAt.toISOString(),
      }),

      // Use the actual type references (not strings)
      author: t.field({
        type: AuthorSummaryType,
        resolve: (article) => article.author,
      }),

      categories: t.field({
        type: [CategorySummaryType],
        resolve: (article) => article.categories,
      }),
    }),
  });

// Article Connection (Pagination)
export const ArticleConnectionType = builder
  .objectRef<{
    items: ArticleFull[];
    total: number;
    hasMore: boolean;
  }>('ArticleConnection')
  .implement({
    fields: (t) => ({
      items: t.field({ type: [ArticleType], resolve: (c) => c.items }),
      total: t.exposeInt('total'),
      hasMore: t.exposeBoolean('hasMore'),
    }),
  });