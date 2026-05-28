import { db }             from '../config/db.js';
import { likes }          from '../db/schema/index.js';
import { eq, and, count } from 'drizzle-orm';

export async function findLike(userId: string, articleId: string) {
  const result = await db.query.likes.findFirst({
    where: and(eq(likes.userId, userId), eq(likes.articleId, articleId)),
  });
  return result ?? null;
}

export async function countLikes(articleId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(likes)
    .where(eq(likes.articleId, articleId));
  return Number(result?.count ?? 0);
}

export async function createLike(userId: string, articleId: string) {
  const [like] = await db.insert(likes).values({ userId, articleId }).returning();
  return like!;
}

export async function deleteLike(userId: string, articleId: string): Promise<boolean> {
  const result = await db
    .delete(likes)
    .where(and(eq(likes.userId, userId), eq(likes.articleId, articleId)))
    .returning({ id: likes.id });
  return result.length > 0;
}