import { db }            from '../config/db.js';
import { bookmarks }     from '../db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';

export async function findBookmark(userId: string, articleId: string) {
  const result = await db.query.bookmarks.findFirst({
    where: and(eq(bookmarks.userId, userId), eq(bookmarks.articleId, articleId)),
  });
  return result ?? null;
}

export async function findBookmarksByUser(userId: string, limit = 20, offset = 0) {
  return db.query.bookmarks.findMany({
    where: eq(bookmarks.userId, userId),
    orderBy: [desc(bookmarks.createdAt)],
    limit,
    offset,
    with: {
      article: {
        with: {
          author: { columns: { id: true, name: true, avatar: true } },
          articleCategories: {
            with: { category: { columns: { id: true, name: true, slug: true } } },
          },
        },
      },
    },
  });
}

export async function createBookmark(userId: string, articleId: string) {
  const [bookmark] = await db.insert(bookmarks).values({ userId, articleId }).returning();
  return bookmark!;
}

export async function deleteBookmark(userId: string, articleId: string): Promise<boolean> {
  const result = await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.articleId, articleId)))
    .returning({ id: bookmarks.id });
  return result.length > 0;
}