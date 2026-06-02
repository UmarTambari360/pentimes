import { db } from '../config/db.js';
import {
  articles,
  articleCategories,
  categories,
  users,
  likes,
  bookmarks,
  comments,
} from '../db/schema/index.js';
import { eq, desc, and, sql, count, inArray } from 'drizzle-orm';
import type { ArticleFilters } from '../types/article.type.js';

export async function findArticleBySlug(slug: string) {
  const result = await db.query.articles.findFirst({
    where: eq(articles.slug, slug),
    with: {
      author: { columns: { id: true, name: true, avatar: true, bio: true } },
      articleCategories: {
        with: { category: { columns: { id: true, name: true, slug: true } } },
      },
    },
  });
  return result ?? null;
}

export async function findArticleById(id: string) {
  const result = await db.query.articles.findFirst({
    where: eq(articles.id, id),
    with: {
      author: { columns: { id: true, name: true, avatar: true, bio: true } },
      articleCategories: {
        with: { category: { columns: { id: true, name: true, slug: true } } },
      },
    },
  });
  return result ?? null;
}

export async function findArticles(filters: ArticleFilters) {
  const { status, categorySlug, authorId, limit, offset } = filters;

  const conditions = [];
  if (status) conditions.push(eq(articles.status, status));
  if (authorId) conditions.push(eq(articles.authorId, authorId));

  if (categorySlug) {
    const cat = await db.query.categories.findFirst({
      where: eq(categories.slug, categorySlug),
    });
    if (cat) {
      const articleIds = await db
        .select({ articleId: articleCategories.articleId })
        .from(articleCategories)
        .where(eq(articleCategories.categoryId, cat.id));
      const ids = articleIds.map((r) => r.articleId);
      if (ids.length === 0) return { items: [], total: 0 };
      conditions.push(inArray(articles.id, ids));
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db.query.articles.findMany({
      where,
      orderBy: [desc(articles.publishedAt), desc(articles.createdAt)],
      limit,
      offset,
      with: {
        author: { columns: { id: true, name: true, avatar: true } },
        articleCategories: {
          with: { category: { columns: { id: true, name: true, slug: true } } },
        },
      },
    }),
    db.select({ count: count() }).from(articles).where(where),
  ]);

  return { items, total: Number(totalResult[0]?.count ?? 0) };
}

export async function findArticlesByAuthor(
  authorId: string,
  limit = 12,
  offset = 0,
) {
  return findArticles({ authorId, limit, offset });
}

export async function createArticle(data: {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  status: 'draft' | 'published';
  authorId: string;
  readingTime: number;
  publishedAt?: Date | null;
}) {
  const [article] = await db.insert(articles).values(data).returning();
  return article!;
}

export async function updateArticle(
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    coverImage: string | null;
    status: 'draft' | 'published';
    readingTime: number;
    publishedAt: Date | null;
    updatedAt: Date;
  }>,
) {
  const [article] = await db
    .update(articles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(articles.id, id))
    .returning();
  return article ?? null;
}

export async function deleteArticle(id: string): Promise<boolean> {
  const result = await db
    .delete(articles)
    .where(eq(articles.id, id))
    .returning({ id: articles.id });
  return result.length > 0;
}

export async function incrementArticleViews(id: string): Promise<void> {
  await db
    .update(articles)
    .set({ views: sql`${articles.views} + 1` })
    .where(eq(articles.id, id));
}

export async function setArticleCategories(
  articleId: string,
  categoryIds: string[],
): Promise<void> {
  await db
    .delete(articleCategories)
    .where(eq(articleCategories.articleId, articleId));
  if (categoryIds.length > 0) {
    await db.insert(articleCategories).values(
      categoryIds.map((categoryId) => ({ articleId, categoryId })),
    );
  }
}

export async function getArticleCounts(articleId: string) {
  const [likeResult, commentResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.articleId, articleId)),
    db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.articleId, articleId)),
  ]);
  return {
    likeCount: Number(likeResult[0]?.count ?? 0),
    commentCount: Number(commentResult[0]?.count ?? 0),
  };
}

/**
 * Sanitise raw user input into a safe PostgreSQL tsquery string.
 *
 * Strategy:
 *   1. Strip characters that are meaningful in tsquery syntax to prevent
 *      injection (! & | ( ) : * <->).
 *   2. Split on whitespace.
 *   3. Remove empty tokens.
 *   4. If the query is a single word, use prefix matching (token:*) so
 *      "nig" matches "Nigeria".
 *   5. If multiple words, join with <-> (phrase search) first; fall back
 *      to & (AND) if phrase search returns 0 results — handled in the
 *      resolver via two-pass logic.
 *
 * This means the GIN index on search_vector IS used for every query.
 */
function buildTsQuery(raw: string): string {
  const sanitised = raw
    .replace(/[!&|():*<>@]/g, ' ') // strip tsquery operators
    .trim()
    .replace(/\s+/g, ' ');

  const tokens = sanitised.split(' ').filter(Boolean);

  if (tokens.length === 0) return '';

  // Single token → prefix search
  if (tokens.length === 1) {
    return `${tokens[0]}:*`;
  }

  // Multiple tokens → phrase search (respects word proximity & uses index)
  return tokens.map((t) => `${t}:*`).join(' & ');
}

/**
 * Full-text search using the pre-computed search_vector GIN index.
 *
 * Performance notes:
 * - search_vector is a GENERATED ALWAYS AS STORED column.
 * - The GIN index on search_vector means PostgreSQL never re-computes
 *   tsvector at query time — it reads directly from the index.
 * - ts_rank is computed only for the matched rows (post-filter), so it
 *   doesn't block index use.
 * - We add eq(articles.status, 'published') as the primary filter so
 *   PostgreSQL can further narrow the result set before ranking.
 */
export async function searchArticles(
  rawQuery: string,
  limit = 12,
  offset = 0,
): Promise<{ items: Awaited<ReturnType<typeof db.query.articles.findMany>>; total: number }> {
  const tsQuery = buildTsQuery(rawQuery);

  if (!tsQuery) {
    return { items: [], total: 0 };
  }

  // We use sql`` template to safely pass the tsquery string as a
  // parameterised value — Drizzle will escape it correctly.
  const searchCondition = sql`${articles.searchVector} @@ to_tsquery('english', ${tsQuery})`;
  const where = and(eq(articles.status, 'published'), searchCondition);

  const [items, totalResult] = await Promise.all([
    db.query.articles.findMany({
      where,
      // Order by relevance rank descending, then recency as tiebreaker
      orderBy: [
        sql`ts_rank(${articles.searchVector}, to_tsquery('english', ${tsQuery})) DESC`,
        desc(articles.publishedAt),
      ],
      limit,
      offset,
      with: {
        author: { columns: { id: true, name: true, avatar: true } },
        articleCategories: {
          with: {
            category: { columns: { id: true, name: true, slug: true } },
          },
        },
      },
    }),
    db.select({ count: count() }).from(articles).where(where),
  ]);

  return { items, total: Number(totalResult[0]?.count ?? 0) };
}