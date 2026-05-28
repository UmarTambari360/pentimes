import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { articles }   from './articles.schema.js';
import { categories } from './categories.schema.js';

export const articleCategories = pgTable(
  'article_categories',
  {
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),

    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.articleId, table.categoryId] }),
  })
);

export type ArticleCategorySelect = typeof articleCategories.$inferSelect;
export type ArticleCategoryInsert = typeof articleCategories.$inferInsert;