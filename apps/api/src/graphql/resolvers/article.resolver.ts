// apps/api/src/graphql/resolvers/article.resolver.ts
import { builder } from '../builder.js';
import {
  findArticles,
  findArticleBySlug,
  findArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  setArticleCategories,
  incrementArticleViews,
  getArticleCounts,
  searchArticles,
}                                   from '../../queries/article.queries.js';
import { findLike }                 from '../../queries/like.queries.js';
import { findBookmark }             from '../../queries/bookmark.queries.js';
import { cacheService, CacheKeys }  from '../../services/redis.service.js';
import { slugify }                  from '../../helpers/slugify.js';
import { calculateReadingTime }     from '../../helpers/reading-time.js';
import { logger }                   from '../../helpers/logger.js';
import { CACHE_TTL }                from '@pentimes/shared';
import {
  CreateArticleInput,
  UpdateArticleInput,
  ArticleFiltersInput,
}                                   from '../inputs.js';
import '../typedefs/article.typedef.js';
import { ArticleType, ArticleConnectionType } from '../typedefs/article.typedef.js';
import type { ArticleFull }                   from '../../types/article.type.js';
import { GraphQLError }                       from 'graphql';
import { ApiError }                           from '../../middleware/errorHandler.middleware.js';

type ArticleWithRelations = Omit<
  Partial<ArticleFull>,
  'author' | 'categories' | 'createdAt' | 'updatedAt' | 'publishedAt'
> & {
  id: string;
  author?: {
    id: string;
    name: string;
    avatar?: string | null;
    bio?: string | null;
  };
  articleCategories?: { category: ArticleFull['categories'][number] }[];
  categories?: ArticleFull['categories'];
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt?: Date | string | null;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function toNullableDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  return toDate(value);
}

function normalizeArticle(raw: ArticleWithRelations): ArticleFull {
  const categories =
    raw.categories ??
    raw.articleCategories?.map((articleCategory) => articleCategory.category) ??
    [];

  return {
    ...raw,
    categories,
    coverImage: raw.coverImage ?? null,
    excerpt: raw.excerpt ?? null,
    publishedAt: toNullableDate(raw.publishedAt),
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
    likeCount: raw.likeCount ?? 0,
    commentCount: raw.commentCount ?? 0,
  } as ArticleFull;
}

function assertArticleStatus(
  status: string | null | undefined,
  fallback?: 'draft' | 'published',
): 'draft' | 'published' | undefined {
  if (status == null) return fallback;
  if (status === 'draft' || status === 'published') return status;
  throw new GraphQLError('Article status must be either draft or published.');
}

// ─── Helper: enrich raw DB row with counts + auth state ───────────────────
async function enrichArticle(
  raw: ArticleWithRelations | null | undefined,
  userId?: string,
): Promise<ArticleFull | null> {
  if (!raw) return null;

  try {
    const article = normalizeArticle(raw);
    const { likeCount, commentCount } = await getArticleCounts(article.id);

    let isLiked: boolean | undefined;
    let isBookmarked: boolean | undefined;

    if (userId) {
      const [like, bookmark] = await Promise.all([
        findLike(userId, article.id),
        findBookmark(userId, article.id),
      ]);
      isLiked     = like     !== null;
      isBookmarked = bookmark !== null;
    }

    const enriched: ArticleFull = {
      ...article,
      likeCount,
      commentCount,
    };

    if (isLiked !== undefined) {
      enriched.isLikedByCurrentUser = isLiked;
    }
    if (isBookmarked !== undefined) {
      enriched.isBookmarkedByCurrentUser = isBookmarked;
    }

    return enriched;
  } catch (err) {
    logger.error('enrichArticle failed', {
      articleId: raw.id,
      error: err instanceof Error ? err.message : String(err),
    });
    // Return the raw article without engagement data rather than crashing.
    return normalizeArticle({
      ...raw,
      likeCount:   0,
      commentCount: 0,
    });
  }
}

// ─── Queries ───────────────────────────────────────────────────────────────

builder.queryField('articles', (t) =>
  t.field({
    type: ArticleConnectionType,
    args: { filters: t.arg({ type: ArticleFiltersInput, required: false }) },
    resolve: async (_parent, { filters }, _ctx) => {
      try {
        const f = {
          status:      assertArticleStatus(filters?.status, 'published'),
          categorySlug: filters?.categorySlug ?? undefined,
          authorId:    filters?.authorId ?? undefined,
          limit:       filters?.limit ?? 12,
          offset:      filters?.offset ?? 0,
        };

        const cacheKey = CacheKeys.articles(
          Math.floor((f.offset ?? 0) / (f.limit ?? 12)),
          f.limit ?? 12,
          f.categorySlug,
        );

        const cached = await cacheService.get<{ items: ArticleWithRelations[]; total: number }>(cacheKey);

        if (cached && !f.authorId && f.status === 'published') {
          return {
            items: cached.items.map(normalizeArticle),
            total: cached.total,
            hasMore: (f.offset ?? 0) + (f.limit ?? 12) < cached.total,
          };
        }

        const { items, total } = await findArticles(f);
        const enriched = await Promise.all(items.map((a) => enrichArticle(a)));

        const result = {
          items: enriched.filter(Boolean) as ArticleFull[],
          total,
        };

        if (f.status === 'published' && !f.authorId) {
          await cacheService.set(cacheKey, result, CACHE_TTL.ARTICLES).catch((err) => {
            logger.warn('Cache set failed for articles list', {
              error: err instanceof Error ? err.message : String(err),
            });
          });
        }

        return {
          ...result,
          hasMore: (f.offset ?? 0) + (f.limit ?? 12) < total,
        };
      } catch (err) {
        logger.error('articles query failed', {
          error: err instanceof Error ? err.message : String(err),
        });
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        throw new GraphQLError('Failed to fetch articles. Please try again.');
      }
    },
  }),
);

builder.queryField('article', (t) =>
  t.field({
    type: ArticleType,
    nullable: true,
    args: { slug: t.arg.string({ required: true }) },
    resolve: async (_parent, { slug }, ctx) => {
      try {
        const cacheKey = CacheKeys.article(slug);
        const cached   = await cacheService.get<ArticleWithRelations>(cacheKey);

        const raw = cached ? null : await findArticleBySlug(slug);
        if (!raw && !cached) return null;

        await incrementArticleViews((raw ?? cached)!.id).catch((err) => {
          logger.warn('incrementArticleViews failed', {
            slug,
            error: err instanceof Error ? err.message : String(err),
          });
        });

        if (cached && !ctx.currentUser) return normalizeArticle(cached);

        const result = await enrichArticle(raw ?? cached, ctx.currentUser?.id);

        if (result && !ctx.currentUser) {
          await cacheService.set(cacheKey, result, CACHE_TTL.ARTICLES).catch((err) => {
            logger.warn('Cache set failed for single article', {
              slug,
              error: err instanceof Error ? err.message : String(err),
            });
          });
        }

        return result;
      } catch (err) {
        logger.error('article query failed', {
          slug,
          error: err instanceof Error ? err.message : String(err),
        });
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        throw new GraphQLError('Failed to fetch article. Please try again.');
      }
    },
  }),
);

builder.queryField('searchArticles', (t) =>
  t.field({
    type: ArticleConnectionType,
    args: {
      query:  t.arg.string({ required: true }),
      limit:  t.arg.int({ required: false, defaultValue: 12 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_parent, { query, limit, offset }) => {
      if (!query || query.trim().length < 2) {
        throw new GraphQLError('Search query must be at least 2 characters.');
      }

      try {
        const cacheKey = CacheKeys.search(query, offset ?? 0, limit ?? 12);
        const cached   = await cacheService.get<{ items: ArticleWithRelations[]; total: number }>(cacheKey);

        if (cached) {
          return {
            items: cached.items.map(normalizeArticle),
            total: cached.total,
            hasMore: (offset ?? 0) + (limit ?? 12) < cached.total,
          };
        }

        const { items, total } = await searchArticles(query, limit ?? 12, offset ?? 0);
        const enriched = await Promise.all(items.map((a) => enrichArticle(a)));

        const result = { items: enriched.filter(Boolean) as ArticleFull[], total };

        await cacheService.set(cacheKey, result, CACHE_TTL.SEARCH).catch((err) => {
          logger.warn('Cache set failed for search', {
            query,
            error: err instanceof Error ? err.message : String(err),
          });
        });

        return { ...result, hasMore: (offset ?? 0) + (limit ?? 12) < total };
      } catch (err) {
        logger.error('searchArticles query failed', {
          query,
          error: err instanceof Error ? err.message : String(err),
        });
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        throw new GraphQLError('Search failed. Please try again.');
      }
    },
  }),
);

// ─── Mutations ─────────────────────────────────────────────────────────────

builder.mutationField('createArticle', (t) =>
  t.field({
    type: ArticleType,
    authScopes: { isAuthor: true },
    args: { input: t.arg({ type: CreateArticleInput, required: true }) },
    resolve: async (_parent, { input }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');

      try {
        const slug        = input.slug ?? slugify(input.title);
        const readingTime = calculateReadingTime(input.content);
        const status      = assertArticleStatus(input.status, 'draft')!;

        const article = await createArticle({
          title:       input.title,
          slug,
          excerpt:     input.excerpt ?? null,
          content:     input.content,
          coverImage:  input.coverImage ?? null,
          status,
          authorId:    ctx.currentUser.id,
          readingTime,
          publishedAt: status === 'published' ? new Date() : null,
        });

        await setArticleCategories(article.id, input.categoryIds);

        await cacheService.invalidateArticleCache().catch((err) => {
          logger.warn('Cache invalidation failed after createArticle', {
            error: err instanceof Error ? err.message : String(err),
          });
        });

        const full = await findArticleById(article.id);
        return enrichArticle(full);
      } catch (err) {
        logger.error('createArticle mutation failed', {
          userId: ctx.currentUser.id,
          error: err instanceof Error ? err.message : String(err),
        });
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        throw new GraphQLError('Failed to create article. Please try again.');
      }
    },
  }),
);

builder.mutationField('updateArticle', (t) =>
  t.field({
    type: ArticleType,
    authScopes: { authenticated: true },
    args: {
      id:    t.arg.string({ required: true }),
      input: t.arg({ type: UpdateArticleInput, required: true }),
    },
    resolve: async (_parent, { id, input }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');

      try {
        const existing = await findArticleById(id);
        if (!existing) throw new GraphQLError('Article not found.');

        if (
          existing.authorId !== ctx.currentUser.id &&
          ctx.currentUser.role !== 'admin'
        ) {
          throw new GraphQLError('You can only edit your own articles.');
        }

        const updates: Record<string, unknown> = {};
        if (input.title) {
          updates.title = input.title;
          if (!input.slug) updates.slug = slugify(input.title);
        }
        if (input.slug)    updates.slug    = input.slug;
        if (input.excerpt !== undefined) updates.excerpt = input.excerpt ?? null;
        if (input.content) {
          updates.content     = input.content;
          updates.readingTime = calculateReadingTime(input.content);
        }
        if (input.coverImage !== undefined) updates.coverImage = input.coverImage ?? null;
        if (input.status) {
          updates.status = assertArticleStatus(input.status);
          if (input.status === 'published' && existing.status === 'draft') {
            updates.publishedAt = new Date();
          }
        }

        await updateArticle(id, updates);
        if (input.categoryIds) await setArticleCategories(id, input.categoryIds);

        await Promise.all([
          cacheService.invalidateArticleCache(existing.slug),
          input.slug && input.slug !== existing.slug
            ? cacheService.del(CacheKeys.article(input.slug))
            : Promise.resolve(),
        ]).catch((err) => {
          logger.warn('Cache invalidation failed after updateArticle', {
            articleId: id,
            error: err instanceof Error ? err.message : String(err),
          });
        });

        const full = await findArticleById(id);
        return enrichArticle(full);
      } catch (err) {
        logger.error('updateArticle mutation failed', {
          articleId: id,
          userId: ctx.currentUser.id,
          error: err instanceof Error ? err.message : String(err),
        });
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        throw new GraphQLError('Failed to update article. Please try again.');
      }
    },
  }),
);

builder.mutationField('deleteArticle', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_parent, { id }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');

      try {
        const existing = await findArticleById(id);
        if (!existing) throw new GraphQLError('Article not found.');

        if (
          existing.authorId !== ctx.currentUser.id &&
          ctx.currentUser.role !== 'admin'
        ) {
          throw new GraphQLError('You can only delete your own articles.');
        }

        const deleted = await deleteArticle(id);
        if (deleted) {
          await cacheService.invalidateArticleCache(existing.slug).catch((err) => {
            logger.warn('Cache invalidation failed after deleteArticle', {
              articleId: id,
              error: err instanceof Error ? err.message : String(err),
            });
          });
        }

        return deleted;
      } catch (err) {
        logger.error('deleteArticle mutation failed', {
          articleId: id,
          userId: ctx.currentUser.id,
          error: err instanceof Error ? err.message : String(err),
        });
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        throw new GraphQLError('Failed to delete article. Please try again.');
      }
    },
  }),
);
