// ──────────────────────────────────────────────────────────────────
// Pen Times Magazine — Shared TypeScript Types
//
// These represent the "public shape" of entities as they cross the
// frontend/backend boundary via GraphQL.
//
// Backend-only types (hashed passwords, raw DB rows) stay in
// apps/api/src/types/ — never here.
// ──────────────────────────────────────────────────────────────────

import type { UserRole, ArticleStatus, ProgramStatus } from './constants.js';

// ── User ──────────────────────────────────────────────────────────

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  bio: string | null;
  createdAt: string;
}

export type ArticleAuthor = Pick<PublicUser, 'id' | 'name' | 'avatar' | 'bio'>;

// ── Article ───────────────────────────────────────────────────────

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  status: ArticleStatus;
  author: ArticleAuthor;
  categories: Category[];
  views: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export type ArticleCard = Pick<
  Article,
  | 'id'
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'coverImage'
  | 'status'
  | 'author'
  | 'categories'
  | 'views'
  | 'readingTime'
  | 'publishedAt'
>;

export interface ArticleWithEngagement extends Article {
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  commentCount: number;
}

// ── Category ──────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export type CategorySummary = Pick<Category, 'id' | 'name' | 'slug'>;

// ── Comment ───────────────────────────────────────────────────────

export interface Comment {
  id: string;
  body: string;
  user: Pick<PublicUser, 'id' | 'name' | 'avatar'>;
  articleId: string;
  createdAt: string;
  updatedAt: string;
}

// ── Scheduled Program ─────────────────────────────────────────────

export interface ScheduledProgram {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: ProgramStatus;
  createdAt: string;
}

// ── Pagination ────────────────────────────────────────────────────

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationInfo;
}

// ── Auth ──────────────────────────────────────────────────────────

export interface AuthPayload {
  user: PublicUser;
  accessToken: string;
}

// ── Dashboard Stats ───────────────────────────────────────────────

export interface AuthorStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalBookmarks: number;
  totalComments: number;
  totalViews: number;
}

export interface AdminStats {
  totalUsers: number;
  totalArticles: number;
  totalComments: number;
  totalViews: number;
  newUsersThisMonth: number;
  newArticlesThisMonth: number;
}