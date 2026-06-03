// apps/api/src/tests/helpers/factories.ts
/**
 * Test data factories — create minimal valid objects for tests.
 */
import { getTestDb } from './db.js';
import { users, articles, categories, articleCategories, comments } from '../../db/schema/index.js';
import argon2 from 'argon2';

let counter = 0;
function uid() { return ++counter; }

export async function createTestUser(overrides: Partial<{
  name: string;
  email: string;
  password: string;
  role: 'reader' | 'author' | 'admin';
}> = {}) {
  const db = getTestDb();
  const n = uid();
  const hashedPassword = await argon2.hash('Password123');
  const [user] = await db.insert(users).values({
    name: overrides.name ?? `Test User ${n}`,
    email: overrides.email ?? `testuser${n}@example.com`,
    password: overrides.password ?? hashedPassword,
    role: overrides.role ?? 'reader',
  }).returning();
  return user!;
}

export async function createTestCategory(overrides: Partial<{
  name: string;
  slug: string;
}> = {}) {
  const db = getTestDb();
  const n = uid();
  const [cat] = await db.insert(categories).values({
    name: overrides.name ?? `Category ${n}`,
    slug: overrides.slug ?? `category-${n}`,
  }).returning();
  return cat!;
}

export async function createTestArticle(
  authorId: string,
  categoryId: string,
  overrides: Partial<{
    title: string;
    slug: string;
    content: string;
    status: 'draft' | 'published';
  }> = {}
) {
  const db = getTestDb();
  const n = uid();
  const [article] = await db.insert(articles).values({
    title: overrides.title ?? `Test Article ${n}`,
    slug: overrides.slug ?? `test-article-${n}`,
    content: overrides.content ?? 'This is the content of the test article. '.repeat(20),
    status: overrides.status ?? 'published',
    authorId,
    readingTime: 2,
    publishedAt: overrides.status === 'draft' ? null : new Date(),
  }).returning();
  await db.insert(articleCategories).values({
    articleId: article!.id,
    categoryId,
  });
  return article!;
}

export async function createTestComment(
  userId: string,
  articleId: string,
  body = 'This is a test comment.'
) {
  const db = getTestDb();
  const [comment] = await db.insert(comments).values({
    body,
    userId,
    articleId,
  }).returning();
  return comment!;
}