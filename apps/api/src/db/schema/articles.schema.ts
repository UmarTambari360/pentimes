import {
  pgTable,
  uuid,
  varchar,
  text,
  pgEnum,
  timestamp,
  integer,
  index,
  customType,
} from 'drizzle-orm/pg-core';
import { sql }   from 'drizzle-orm';
import { users } from './users.schema.js';

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const articleStatusEnum = pgEnum('article_status', [
  'draft',
  'published',
]);

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    title: varchar('title', { length: 300 }).notNull(),

    slug: varchar('slug', { length: 350 }).notNull().unique(),

    excerpt: varchar('excerpt', { length: 500 }),

    content: text('content').notNull(),

    coverImage: text('cover_image'),

    status: articleStatusEnum('status').notNull().default('draft'),

    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    views: integer('views').notNull().default(0),

    readingTime: integer('reading_time').notNull().default(1),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),

    publishedAt: timestamp('published_at', { withTimezone: true }),

    /* GIN index created at a custom migration file 001_add_search_vector.sql */
    searchVector: tsvector('search_vector')
      .generatedAlwaysAs(
        sql`to_tsvector('english',
          coalesce(title, '') || ' ' ||
          coalesce(excerpt, '') || ' ' ||
          coalesce(content, '')
        )`
      )
      .notNull(),
  },
  (table) => ({
    /**
     * Composite index on (status, published_at) —
     * covers the "latest published articles" query pattern.
     */
    statusPublishedAtIdx: index('articles_status_published_at_idx').on(
      table.status,
      table.publishedAt
    ),

    /**
     * Index on author_id — used by the author dashboard
     * "My Articles" page.
     */
    authorIdx: index('articles_author_id_idx').on(table.authorId),
  })
);

export type ArticleSelect = typeof articles.$inferSelect;
export type ArticleInsert = typeof articles.$inferInsert;