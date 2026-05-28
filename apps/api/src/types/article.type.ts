import { z } from 'zod';
import type { ArticleSelect }  from '../db/schema/index.js';
import type { PublicUser }     from './user.type.js';
import type { CategorySelect } from '../db/schema/index.js';

/**
 * ─── Shape Variants ───────────────────────────────────────────────────────────
 *
 * We need three article shapes:
 *
 * ArticleRow     — raw DB row (used only inside query functions)
 * ArticleSummary — lightweight shape for lists/cards (no content field)
 * ArticleFull    — complete shape with author and categories resolved
 *
 * Keeping these separate prevents accidentally sending the full article
 * body (potentially large HTML) in list queries that only need metadata.
 */

export type ArticleRow = ArticleSelect;

export type ArticleSummary = Omit<ArticleRow, 'content' | 'searchVector'> & {
  author: Pick<PublicUser, 'id' | 'name' | 'avatar'>;
  categories: Pick<CategorySelect, 'id' | 'name' | 'slug'>[];
  likeCount: number;
  commentCount: number;
};

export type ArticleFull = Omit<ArticleRow, 'searchVector'> & {
  author: Pick<PublicUser, 'id' | 'name' | 'avatar' | 'bio'>;
  categories: Pick<CategorySelect, 'id' | 'name' | 'slug'>[];
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser?: boolean;
  isBookmarkedByCurrentUser?: boolean;
};

// ─── Pagination
export type PaginatedArticles = {
  articles: ArticleSummary[];
  total: number;
  hasMore: boolean;
};

// ─── Input Schemas
export const CreateArticleSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(300, 'Title cannot exceed 300 characters')
    .trim(),

  excerpt: z
    .string()
    .max(500, 'Excerpt cannot exceed 500 characters')
    .trim()
    .optional(),

  content: z.string().min(1, 'Article content cannot be empty'),

  coverImage: z.string().url('Cover image must be a valid URL').optional(),

  /**
   * Slug is optional at creation time — the API auto-generates it
   * from the title if not provided. If provided, it is validated
   * and sanitised before use.
   */
  slug: z
    .string()
    .max(350, 'Slug cannot exceed 350 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase letters, numbers, and hyphens only'
    )
    .optional(),

  status: z.enum(['draft', 'published']).default('draft'),

  categoryIds: z
    .array(z.string().uuid('Each category ID must be a valid UUID'))
    .min(1, 'At least one category is required')
    .max(5, 'An article cannot have more than 5 categories'),
});

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;

export const UpdateArticleSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(300, 'Title cannot exceed 300 characters')
    .trim()
    .optional(),

  excerpt: z
    .string()
    .max(500, 'Excerpt cannot exceed 500 characters')
    .trim()
    .optional(),

  content: z.string().min(1, 'Article content cannot be empty').optional(),

  coverImage: z
    .string()
    .url('Cover image must be a valid URL')
    .nullable()
    .optional(),

  slug: z
    .string()
    .max(350, 'Slug cannot exceed 350 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase letters, numbers, and hyphens only'
    )
    .optional(),

  status: z.enum(['draft', 'published']).optional(),

  categoryIds: z
    .array(z.string().uuid('Each category ID must be a valid UUID'))
    .min(1, 'At least one category is required')
    .max(5, 'An article cannot have more than 5 categories')
    .optional(),
});

export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;

export const ArticleFiltersSchema = z.object({
  status: z.enum(['draft', 'published']).optional(),
  categorySlug: z.string().optional(),
  authorId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(12),
  offset: z.number().int().min(0).default(0),
});

export type ArticleFilters = z.infer<typeof ArticleFiltersSchema>;

export const SearchArticlesSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters').trim(),
  limit: z.number().int().min(1).max(50).default(12),
  offset: z.number().int().min(0).default(0),
});

export type SearchArticlesInput = z.infer<typeof SearchArticlesSchema>;