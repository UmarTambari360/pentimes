import { db } from '../config/db.js';
import { comments } from '../db/schema/index.js';
import { eq, desc, count } from 'drizzle-orm';

const commentWithUserQuery = {
  with: {
    user: { columns: { id: true, name: true, avatar: true } },
  },
} as const;

export async function findCommentsByArticle(articleId: string, limit = 20, offset = 0) {
  const [items, totalResult] = await Promise.all([
    db.query.comments.findMany({
      where: eq(comments.articleId, articleId),
      orderBy: [desc(comments.createdAt)],
      limit,
      offset,
      ...commentWithUserQuery,
    }),
    db.select({ count: count() }).from(comments).where(eq(comments.articleId, articleId)),
  ]);
  return { items, total: Number(totalResult[0]?.count ?? 0) };
}

export async function findCommentsByUser(userId: string, limit = 20, offset = 0) {
  return db.query.comments.findMany({
    where: eq(comments.userId, userId),
    orderBy: [desc(comments.createdAt)],
    limit,
    offset,
    with: {
      user: { columns: { id: true, name: true, avatar: true } },
      article: { columns: { id: true, title: true, slug: true } },
    },
  });
}

export async function findCommentById(id: string) {
  const result = await db.query.comments.findFirst({
    where: eq(comments.id, id),
    ...commentWithUserQuery,
  });
  return result ?? null;
}

export async function createComment(data: {
  body: string;
  userId: string;
  articleId: string;
}) {
  const [comment] = await db.insert(comments).values(data).returning();
  if (!comment) throw new Error('Failed to create comment');

  const full = await db.query.comments.findFirst({
    where: eq(comments.id, comment.id),
    ...commentWithUserQuery,
  });
  return full!;
}

export async function updateComment(id: string, body: string) {
  const [comment] = await db
    .update(comments)
    .set({ body, updatedAt: new Date() })
    .where(eq(comments.id, id))
    .returning();
  if (!comment) return null;

  const full = await db.query.comments.findFirst({
    where: eq(comments.id, comment.id),
    ...commentWithUserQuery,
  });
  return full ?? null;
}

export async function deleteComment(id: string): Promise<boolean> {
  const result = await db
    .delete(comments)
    .where(eq(comments.id, id))
    .returning({ id: comments.id });
  return result.length > 0;
}