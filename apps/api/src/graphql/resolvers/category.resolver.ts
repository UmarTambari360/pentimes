// apps/api/src/graphql/resolvers/category.resolver.ts
import { builder } from '../builder.js';
import {
  findAllCategories,
  findCategoryBySlug,
  findCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
}                                  from '../../queries/category.queries.js';
import { cacheService, CacheKeys } from '../../services/redis.service.js';
import { slugify }                 from '../../helpers/slugify.js';
import { logger }                  from '../../helpers/logger.js';
import { CACHE_TTL }               from '@pentimes/shared';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
}                                  from '../inputs.js';
import '../typedefs/category.typedef.js';
import { CategoryType }            from '../typedefs/category.typedef.js';
import { GraphQLError }            from 'graphql';
import { ApiError }                from '../../middleware/errorHandler.middleware.js';

builder.queryField('categories', (t) =>
  t.field({
    type: [CategoryType],
    resolve: async () => {
      try {
        const cached = await cacheService.get<Awaited<ReturnType<typeof findAllCategories>>>(
          CacheKeys.categories(),
        );
        if (cached) return cached;
        const result = await findAllCategories();
        await cacheService.set(CacheKeys.categories(), result, CACHE_TTL.CATEGORIES).catch((err) => {
          logger.warn('Cache set failed for categories', { error: err instanceof Error ? err.message : String(err) });
        });
        return result;
      } catch (err) {
        logger.error('categories query failed', { error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to fetch categories.');
      }
    },
  }),
);

builder.queryField('category', (t) =>
  t.field({
    type: CategoryType,
    nullable: true,
    args: { slug: t.arg.string({ required: true }) },
    resolve: async (_parent, { slug }) => {
      try {
        return await findCategoryBySlug(slug);
      } catch (err) {
        logger.error('category query failed', { slug, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to fetch category.');
      }
    },
  }),
);

builder.mutationField('createCategory', (t) =>
  t.field({
    type: CategoryType,
    authScopes: { role: 'admin' },
    args: { input: t.arg({ type: CreateCategoryInput, required: true }) },
    resolve: async (_parent, { input }) => {
      try {
        const slug     = input.slug ?? slugify(input.name);
        const category = await createCategory({
          name:        input.name,
          slug,
          description: input.description ?? null,
        });
        await cacheService.invalidateCategoryCache().catch((err) => {
          logger.warn('Cache invalidation failed after createCategory', { error: err instanceof Error ? err.message : String(err) });
        });
        return category;
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('createCategory mutation failed', { error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to create category. Please try again.');
      }
    },
  }),
);

builder.mutationField('updateCategory', (t) =>
  t.field({
    type: CategoryType,
    authScopes: { role: 'admin' },
    args: {
      id:    t.arg.string({ required: true }),
      input: t.arg({ type: UpdateCategoryInput, required: true }),
    },
    resolve: async (_parent, { id, input }) => {
      try {
        const updates: Parameters<typeof updateCategory>[1] = {};
        if (input.name) {
          updates.name = input.name;
          if (!input.slug) updates.slug = slugify(input.name);
        }
        if (input.slug)                    updates.slug        = input.slug;
        if (input.description !== undefined) updates.description = input.description ?? null;

        const category = await updateCategory(id, updates);
        if (!category) throw new GraphQLError('Category not found.');
        await cacheService.invalidateCategoryCache().catch((err) => {
          logger.warn('Cache invalidation failed after updateCategory', { error: err instanceof Error ? err.message : String(err) });
        });
        return category;
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('updateCategory mutation failed', { categoryId: id, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to update category. Please try again.');
      }
    },
  }),
);

builder.mutationField('deleteCategory', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { role: 'admin' },
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_parent, { id }) => {
      try {
        const existing = await findCategoryById(id);
        if (!existing) throw new GraphQLError('Category not found.');
        const deleted = await deleteCategory(id);
        if (deleted) {
          await cacheService.invalidateCategoryCache().catch((err) => {
            logger.warn('Cache invalidation failed after deleteCategory', { error: err instanceof Error ? err.message : String(err) });
          });
        }
        return deleted;
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('deleteCategory mutation failed', { categoryId: id, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to delete category. Please try again.');
      }
    },
  }),
);