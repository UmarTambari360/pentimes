import {
  pgTable,
  uuid,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users }    from './users.schema.js';
import { articles } from './articles.schema.js';

export const likes = pgTable(
  'likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueUserArticle: uniqueIndex('likes_user_article_unique_idx').on(
      table.userId,
      table.articleId
    ),
  })
);

export type LikeSelect = typeof likes.$inferSelect;
export type LikeInsert = typeof likes.$inferInsert;