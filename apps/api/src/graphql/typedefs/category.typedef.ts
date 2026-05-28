import { builder } from '../builder.js';
import type { Category } from '../../types/category.type.ts';

// Category Type (Full)
export const CategoryType = builder
  .objectRef<Category>('Category')
  .implement({
    fields: (t) => ({
      id: t.exposeString('id'),
      name: t.exposeString('name'),
      slug: t.exposeString('slug'),
      description: t.exposeString('description', { nullable: true }),

      createdAt: t.field({
        type: 'String',
        resolve: (category) => category.createdAt.toISOString(),
      }),
    }),
  });

// Category Summary (Lightweight for lists)
export const CategorySummaryType = builder
  .objectRef<{
    id: string;
    name: string;
    slug: string;
  }>('CategorySummary')
  .implement({
    fields: (t) => ({
      id: t.exposeString('id'),
      name: t.exposeString('name'),
      slug: t.exposeString('slug'),
    }),
  });