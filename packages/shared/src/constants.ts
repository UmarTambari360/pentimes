// ──────────────────────────────────────────────────────────────────
// Pen Times Magazine — Shared Constants
// Single source of truth for roles, statuses, and enums used
// across both frontend and backend. Never redefine these elsewhere.
// ──────────────────────────────────────────────────────────────────

// ── User Roles ────────────────────────────────────────────────────
export const USER_ROLES = {
  READER: 'reader',
  AUTHOR: 'author',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_VALUES = Object.values(USER_ROLES) as [
  UserRole,
  ...UserRole[],
];

// ── Article Status ────────────────────────────────────────────────
export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export type ArticleStatus =
  (typeof ARTICLE_STATUS)[keyof typeof ARTICLE_STATUS];

export const ARTICLE_STATUS_VALUES = Object.values(ARTICLE_STATUS) as [
  ArticleStatus,
  ...ArticleStatus[],
];

// ── Scheduled Program Status ──────────────────────────────────────
export const PROGRAM_STATUS = {
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type ProgramStatus =
  (typeof PROGRAM_STATUS)[keyof typeof PROGRAM_STATUS];

export const PROGRAM_STATUS_VALUES = Object.values(PROGRAM_STATUS) as [
  ProgramStatus,
  ...ProgramStatus[],
];

// ── Pagination Defaults ───────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 50,
  DEFAULT_OFFSET: 0,
} as const;

// ── Cache TTL (seconds) ───────────────────────────────────────────
export const CACHE_TTL = {
  ARTICLES: 300,         // 5 minutes
  ARTICLE_SINGLE: 300,   // 5 minutes
  CATEGORIES: 1800,      // 30 minutes
  PROGRAMS: 600,         // 10 minutes
  SEARCH: 120,           // 2 minutes
} as const;

// ── JWT ───────────────────────────────────────────────────────────
export const JWT = {
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '7d',
  REFRESH_EXPIRY_SECONDS: 7 * 24 * 60 * 60,
} as const;

// ── Cloudinary ────────────────────────────────────────────────────
export const CLOUDINARY = {
  UPLOAD_FOLDER: 'pentimes',
  ARTICLE_COVERS_FOLDER: 'pentimes/covers',
  AVATARS_FOLDER: 'pentimes/avatars',
  MAX_FILE_SIZE_MB: 10,
} as const;

// ── Reading Time ──────────────────────────────────────────────────
export const READING_TIME = {
  WORDS_PER_MINUTE: 200,
} as const;

// ── Content Limits ────────────────────────────────────────────────
export const CONTENT_LIMITS = {
  TITLE_MIN: 5,
  TITLE_MAX: 200,
  EXCERPT_MIN: 20,
  EXCERPT_MAX: 500,
  BIO_MAX: 500,
  COMMENT_MIN: 2,
  COMMENT_MAX: 1000,
  CATEGORY_NAME_MAX: 100,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
} as const;