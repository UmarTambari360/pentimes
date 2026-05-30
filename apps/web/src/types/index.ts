// Re-export shared types for convenience
export type {
  PublicUser,
  Article,
  ArticleCard,
  ArticleWithEngagement,
  Category,
  CategorySummary,
  Comment,
  ScheduledProgram,
  PaginationInfo,
  PaginatedResult,
  AuthPayload,
  AuthorStats,
  AdminStats,
} from '@pentimes/shared';

// ── Frontend-specific types ──────────────────────────────────────

export interface ArticleConnectionResult {
  items: ArticleCardType[];
  total: number;
  hasMore: boolean;
}

export interface ArticleCardType {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  status: 'draft' | 'published';
  views: number;
  readingTime: number;
  publishedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  likeCount: number;
  commentCount: number;
  isLiked: boolean | null;
  isBookmarked: boolean | null;
}

export interface ArticleFullType extends ArticleCardType {
  content: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    bio: string | null;
  };
}

export interface CategoryType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export interface CommentType {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface AdminCommentType extends CommentType {
  articleId: string;
  articleTitle: string;
  articleSlug: string;
}

export interface CommentConnectionResult {
  items: CommentType[];
  total: number;
}

export interface ScheduledProgramType {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMinutes: number | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface UserType {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'reader' | 'author' | 'admin';
  bio: string | null;
  createdAt: string;
}

export interface NavLink {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';