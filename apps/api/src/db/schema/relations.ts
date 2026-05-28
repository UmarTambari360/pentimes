import { relations }        from 'drizzle-orm';
import { users }            from './users.schema.js';
import { articles }         from './articles.schema.js';
import { categories }       from './categories.schema.js';
import { articleCategories } from './article-categories.schema.js';
import { comments }         from './comments.schema.js';
import { likes }            from './likes.schema.js';
import { bookmarks }        from './bookmarks.schema.js';


// ─── Users

export const usersRelations = relations(users, ({ many }) => ({
  articles: many(articles),

  comments: many(comments),

  likes: many(likes),

  bookmarks: many(bookmarks),
}));

// ─── Articles

export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),

  articleCategories: many(articleCategories),

  comments: many(comments),

  likes: many(likes),

  bookmarks: many(bookmarks),
}));

// ─── Categories

export const categoriesRelations = relations(categories, ({ many }) => ({
  articleCategories: many(articleCategories),
}));

// ─── Article Categories (junction)

export const articleCategoriesRelations = relations(
  articleCategories,
  ({ one }) => ({
    article: one(articles, {
      fields: [articleCategories.articleId],
      references: [articles.id],
    }),

    category: one(categories, {
      fields: [articleCategories.categoryId],
      references: [categories.id],
    }),
  })
);

// ─── Comments

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),

  article: one(articles, {
    fields: [comments.articleId],
    references: [articles.id],
  }),
}));

// ─── Likes

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),

  article: one(articles, {
    fields: [likes.articleId],
    references: [articles.id],
  }),
}));

// ─── Bookmarks

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),

  article: one(articles, {
    fields: [bookmarks.articleId],
    references: [articles.id],
  }),
}));