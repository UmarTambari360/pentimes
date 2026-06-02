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
} from '../../queries/article.queries.js';
import { findLike } from '../../queries/like.queries.js';
import { findBookmark } from '../../queries/bookmark.queries.js';
import { cacheService, CacheKeys } from '../../services/redis.service.js';
import { slugify } from '../../helpers/slugify.js';
import { calculateReadingTime } from '../../helpers/reading-time.js';
import { CACHE_TTL } from '@pentimes/shared';
import {
  CreateArticleInput,
  UpdateArticleInput,
  ArticleFiltersInput,
} from '../inputs.js';

import '../typedefs/article.typedef.js';
import {
  ArticleType,
  ArticleConnectionType,
} from '../typedefs/article.typedef.js';
import type { ArticleFull } from '../../types/article.type.ts';
import { GraphQLError } from 'graphql';

async function enrichArticle(
  raw: any,
  userId?: string,
): Promise<ArticleFull | null> {
  if (!raw) return null;

  const { likeCount, commentCount } = await getArticleCounts(raw.id);

  let isLiked: boolean | null = null;
  let isBookmarked: boolean | null = null;

  if (userId) {
    const [like, bookmark] = await Promise.all([
      findLike(userId, raw.id),
      findBookmark(userId, raw.id),
    ]);
    isLiked = like !== null;
    isBookmarked = bookmark !== null;
  }

  return {
    ...raw,
    coverImage: raw.coverImage ?? null,
    excerpt: raw.excerpt ?? null,
    publishedAt: raw.publishedAt ?? null,
    likeCount,
    commentCount,
    isLikedByCurrentUser: isLiked,
    isBookmarkedByCurrentUser: isBookmarked,
  } as ArticleFull;
}

// ── Queries ──────────────────────────────────────────────────────────────────

builder.queryField('articles', (t) =>
  t.field({
    type: ArticleConnectionType,
    args: { filters: t.arg({ type: ArticleFiltersInput, required: false }) },
    resolve: async (_parent, { filters }, _ctx) => {
      const f = {
        status: (filters?.status as 'draft' | 'published' | undefined) ?? 'published',
        categorySlug: filters?.categorySlug ?? undefined,
        authorId: filters?.authorId ?? undefined,
        limit: filters?.limit ?? 12,
        offset: filters?.offset ?? 0,
      };

      const cacheKey = CacheKeys.articles(
        Math.floor((f.offset ?? 0) / (f.limit ?? 12)),
        f.limit ?? 12,
        f.categorySlug,
      );

      const cached = await cacheService.get<{
        items: ArticleFull[];
        total: number;
      }>(cacheKey);

      if (cached && !f.authorId && f.status === 'published') {
        return {
          ...cached,
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
        await cacheService.set(cacheKey, result, CACHE_TTL.ARTICLES);
      }

      return {
        ...result,
        hasMore: (f.offset ?? 0) + (f.limit ?? 12) < total,
      };
    },
  }),
);

builder.queryField('article', (t) =>
  t.field({
    type: ArticleType,
    nullable: true,
    args: { slug: t.arg.string({ required: true }) },
    resolve: async (_parent, { slug }, ctx) => {
      const cacheKey = CacheKeys.article(slug);
      const cached = await cacheService.get<ArticleFull>(cacheKey);

      const raw = cached ? null : await findArticleBySlug(slug);
      if (!raw && !cached) return null;

      const articleId = (raw ?? cached)!.id;
      await incrementArticleViews(articleId).catch(() => {});

      if (cached && !ctx.currentUser) return cached;

      const result = await enrichArticle(raw ?? cached, ctx.currentUser?.id);

      if (result && !ctx.currentUser) {
        await cacheService.set(cacheKey, result, CACHE_TTL.ARTICLE_SINGLE);
      }

      return result;
    },
  }),
);

/**
 * searchArticles resolver.
 *
 * Cache strategy:
 * - Normalise the query to lowercase + trimmed before building the cache
 *   key. This prevents "Nigeria" and "nigeria" from being two separate
 *   cache entries.
 * - TTL is short (CACHE_TTL.SEARCH = 2 minutes) because search results
 *   should reflect newly published articles quickly.
 * - We do NOT cache search results per-user (no bookmarked/liked state
 *   in search results — those are fetched on the article page).
 */
builder.queryField('searchArticles', (t) =>
  t.field({
    type: ArticleConnectionType,
    args: {
      query: t.arg.string({ required: true }),
      limit: t.arg.int({ required: false, defaultValue: 12 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_parent, { query, limit, offset }) => {
      const normalisedQuery = query.trim().toLowerCase();
      const safeLimit = limit ?? 12;
      const safeOffset = offset ?? 0;

      // Reject trivially short queries at the API layer
      if (normalisedQuery.length < 2) {
        return { items: [], total: 0, hasMore: false };
      }

      const cacheKey = CacheKeys.search(normalisedQuery, safeOffset, safeLimit);
      const cached = await cacheService.get<{
        items: ArticleFull[];
        total: number;
      }>(cacheKey);

      if (cached) {
        return {
          ...cached,
          hasMore: safeOffset + safeLimit < cached.total,
        };
      }

      const { items, total } = await searchArticles(
        normalisedQuery,
        safeLimit,
        safeOffset,
      );

      const enriched = await Promise.all(items.map((a) => enrichArticle(a)));

      const result = {
        items: enriched.filter(Boolean) as ArticleFull[],
        total,
      };

      await cacheService.set(cacheKey, result, CACHE_TTL.SEARCH);

      return {
        ...result,
        hasMore: safeOffset + safeLimit < total,
      };
    },
  }),
);

// ── Mutations ─────────────────────────────────────────────────────────────────

builder.mutationField('createArticle', (t) =>
  t.field({
    type: ArticleType,
    authScopes: { isAuthor: true },
    args: { input: t.arg({ type: CreateArticleInput, required: true }) },
    resolve: async (_parent, { input }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');

      const slug = input.slug ?? slugify(input.title);
      const readingTime = calculateReadingTime(input.content);
      const status = (input.status as 'draft' | 'published') ?? 'draft';

      const article = await createArticle({
        title: input.title,
        slug,
        excerpt: input.excerpt ?? null,
        content: input.content,
        coverImage: input.coverImage ?? null,
        status,
        authorId: ctx.currentUser.id,
        readingTime,
        publishedAt: status === 'published' ? new Date() : null,
      });

      await setArticleCategories(article.id, input.categoryIds);
      await cacheService.invalidateArticleCache();

      const full = await findArticleById(article.id);
      return enrichArticle(full);
    },
  }),
);

builder.mutationField('updateArticle', (t) =>
  t.field({
    type: ArticleType,
    authScopes: { authenticated: true },
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateArticleInput, required: true }),
    },
    resolve: async (_parent, { id, input }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');

      const existing = await findArticleById(id);
      if (!existing) throw new GraphQLError('Article not found');

      if (
        existing.authorId !== ctx.currentUser.id &&
        ctx.currentUser.role !== 'admin'
      ) {
        throw new GraphQLError('You can only edit your own articles');
      }

      const updates: any = {};
      if (input.title) {
        updates.title = input.title;
        if (!input.slug) updates.slug = slugify(input.title);
      }
      if (input.slug) updates.slug = input.slug;
      if (input.excerpt !== undefined) updates.excerpt = input.excerpt ?? null;
      if (input.content) {
        updates.content = input.content;
        updates.readingTime = calculateReadingTime(input.content);
      }
      if (input.coverImage !== undefined)
        updates.coverImage = input.coverImage ?? null;
      if (input.status) {
        updates.status = input.status as 'draft' | 'published';
        if (input.status === 'published' && existing.status === 'draft') {
          updates.publishedAt = new Date();
        }
      }

      await updateArticle(id, updates);
      if (input.categoryIds) await setArticleCategories(id, input.categoryIds);

      await cacheService.invalidateArticleCache(existing.slug);

      const full = await findArticleById(id);
      return enrichArticle(full);
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

      const existing = await findArticleById(id);
      if (!existing) throw new GraphQLError('Article not found');

      if (
        existing.authorId !== ctx.currentUser.id &&
        ctx.currentUser.role !== 'admin'
      ) {
        throw new GraphQLError('You can only delete your own articles');
      }

      const deleted = await deleteArticle(id);
      if (deleted) await cacheService.invalidateArticleCache(existing.slug);

      return deleted;
    },
  }),
);