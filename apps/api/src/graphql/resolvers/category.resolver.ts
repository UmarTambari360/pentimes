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
import { CACHE_TTL }               from '@pentimes/shared';
import { 
  CreateCategoryInput, 
  UpdateCategoryInput }            from '../inputs.js';
import '../typedefs/category.typedef.js';
import { CategoryType }            from '../typedefs/category.typedef.js';
import { GraphQLError }            from 'graphql';

builder.queryField('categories', (t) =>
  t.field({
    type: [CategoryType],
    resolve: async () => {
      const cached = await cacheService.get<Awaited<ReturnType<typeof findAllCategories>>>(
        CacheKeys.categories()
      );
      if (cached) return cached;
      const result = await findAllCategories();
      await cacheService.set(CacheKeys.categories(), result, CACHE_TTL.CATEGORIES);
      return result;
    },
  })
);

builder.queryField('category', (t) =>
  t.field({
    type: CategoryType,
    nullable: true,
    args: { slug: t.arg.string({ required: true }) },
    resolve: async (_parent, { slug }) => findCategoryBySlug(slug),
  })
);

builder.mutationField('createCategory', (t) =>
  t.field({
    type: CategoryType,
    authScopes: { role: 'admin' },
    args: { input: t.arg({ type: CreateCategoryInput, required: true }) },
    resolve: async (_parent, { input }) => {
      const slug = input.slug ?? slugify(input.name);
      const category = await createCategory({
        name: input.name,
        slug,
        description: input.description ?? null,
      });
      await cacheService.invalidateCategoryCache();
      return category;
    },
  })
);

builder.mutationField('updateCategory', (t) =>
  t.field({
    type: CategoryType,
    authScopes: { role: 'admin' },
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateCategoryInput, required: true }),
    },
    resolve: async (_parent, { id, input }) => {
      const updates: Parameters<typeof updateCategory>[1] = {};
      if (input.name) {
        updates.name = input.name;
        if (!input.slug) updates.slug = slugify(input.name);
      }
      if (input.slug) updates.slug = input.slug;
      if (input.description !== undefined) updates.description = input.description ?? null;

      const category = await updateCategory(id, updates);
      if (!category) throw new GraphQLError('Category not found');
      await cacheService.invalidateCategoryCache();
      return category;
    },
  })
);

builder.mutationField('deleteCategory', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { role: 'admin' },
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_parent, { id }) => {
      const existing = await findCategoryById(id);
      if (!existing) throw new GraphQLError('Category not found');
      const deleted = await deleteCategory(id);
      if (deleted) await cacheService.invalidateCategoryCache();
      return deleted;
    },
  })
);