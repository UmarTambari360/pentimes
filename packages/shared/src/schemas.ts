// ──────────────────────────────────────────────────────────────────
// Pen Times Magazine — Shared Zod Schemas
//
// Used on BOTH frontend (form validation via React Hook Form) and
// backend (input validation in resolvers).
//
// WHY shared schemas:
//   Duplicating validation logic causes drift. A password rule
//   changed on the backend silently breaks the frontend if they're
//   separate files. One source eliminates that class of bug.
// ──────────────────────────────────────────────────────────────────

import { z } from 'zod';
import {
  USER_ROLE_VALUES,
  ARTICLE_STATUS_VALUES,
  PROGRAM_STATUS_VALUES,
  CONTENT_LIMITS,
} from './constants.js';

// ── Auth ──────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(
      CONTENT_LIMITS.PASSWORD_MIN,
      `Password must be at least ${CONTENT_LIMITS.PASSWORD_MIN} characters`
    )
    .max(CONTENT_LIMITS.PASSWORD_MAX),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(
        CONTENT_LIMITS.PASSWORD_MIN,
        `New password must be at least ${CONTENT_LIMITS.PASSWORD_MIN} characters`
      )
      .max(CONTENT_LIMITS.PASSWORD_MAX),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// ── User ──────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .trim()
    .optional(),
  bio: z
    .string()
    .max(
      CONTENT_LIMITS.BIO_MAX,
      `Bio must be at most ${CONTENT_LIMITS.BIO_MAX} characters`
    )
    .trim()
    .optional()
    .nullable(),
  avatar: z.string().url('Invalid avatar URL').optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const UpdateUserRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(USER_ROLE_VALUES, {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

// ── Article ───────────────────────────────────────────────────────

export const CreateArticleSchema = z.object({
  title: z
    .string()
    .min(
      CONTENT_LIMITS.TITLE_MIN,
      `Title must be at least ${CONTENT_LIMITS.TITLE_MIN} characters`
    )
    .max(
      CONTENT_LIMITS.TITLE_MAX,
      `Title must be at most ${CONTENT_LIMITS.TITLE_MAX} characters`
    )
    .trim(),
  excerpt: z
    .string()
    .min(
      CONTENT_LIMITS.EXCERPT_MIN,
      `Excerpt must be at least ${CONTENT_LIMITS.EXCERPT_MIN} characters`
    )
    .max(
      CONTENT_LIMITS.EXCERPT_MAX,
      `Excerpt must be at most ${CONTENT_LIMITS.EXCERPT_MAX} characters`
    )
    .trim(),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  coverImage: z.string().url('Invalid cover image URL').optional().nullable(),
  status: z.enum(ARTICLE_STATUS_VALUES).default('draft'),
  categoryIds: z
    .array(z.string().uuid('Invalid category ID'))
    .min(1, 'Select at least one category')
    .max(5, 'Maximum 5 categories'),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase with hyphens only'
    )
    .optional(),
});

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;

export const UpdateArticleSchema = CreateArticleSchema.partial().extend({
  id: z.string().uuid('Invalid article ID'),
});

export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;

// ── Category ──────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(CONTENT_LIMITS.CATEGORY_NAME_MAX)
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional()
    .nullable(),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase with hyphens only'
    )
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  id: z.string().uuid('Invalid category ID'),
});

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

// ── Comment ───────────────────────────────────────────────────────

export const CreateCommentSchema = z.object({
  body: z
    .string()
    .min(
      CONTENT_LIMITS.COMMENT_MIN,
      `Comment must be at least ${CONTENT_LIMITS.COMMENT_MIN} characters`
    )
    .max(
      CONTENT_LIMITS.COMMENT_MAX,
      `Comment must be at most ${CONTENT_LIMITS.COMMENT_MAX} characters`
    )
    .trim(),
  articleId: z.string().uuid('Invalid article ID'),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

// ── Scheduled Program ─────────────────────────────────────────────

export const CreateProgramSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .trim()
    .optional()
    .nullable(),
  scheduledAt: z
    .string()
    .datetime({ message: 'Scheduled date must be a valid ISO datetime' }),
  durationMinutes: z
    .number()
    .int('Duration must be a whole number')
    .min(1, 'Minimum 1 minute')
    .max(600, 'Maximum 600 minutes'),
  status: z.enum(PROGRAM_STATUS_VALUES).default('upcoming'),
});

export type CreateProgramInput = z.infer<typeof CreateProgramSchema>;

export const UpdateProgramSchema = CreateProgramSchema.partial().extend({
  id: z.string().uuid('Invalid program ID'),
});

export type UpdateProgramInput = z.infer<typeof UpdateProgramSchema>;

// ── Search ────────────────────────────────────────────────────────

export const SearchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(200)
    .trim(),
  limit: z.number().int().min(1).max(50).default(12),
  offset: z.number().int().min(0).default(0),
});

export type SearchInput = z.infer<typeof SearchSchema>;

// ── Pagination ────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(50).default(12),
  offset: z.number().int().min(0).default(0),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;