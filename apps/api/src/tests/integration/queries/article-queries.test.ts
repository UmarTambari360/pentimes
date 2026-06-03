// apps/api/src/tests/integration/queries/article.queries.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDb, teardownTestDb, cleanTables, getTestDb } from '../../helpers/db.js';
import { createTestUser, createTestCategory, createTestArticle } from '../../helpers/factories.js';
import {
  findArticleBySlug,
  findArticleById,
  findArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  setArticleCategories,
  incrementArticleViews,
  getArticleCounts,
  searchArticles,
} from '../../../queries/article.queries.js';
import { articleCategories } from '../../../db/schema/index.js';
import { eq } from 'drizzle-orm';

beforeAll(async () => { await setupTestDb(); });
afterAll(async () => { await teardownTestDb(); });
beforeEach(async () => { await cleanTables(); });

describe('createArticle + findArticleBySlug', () => {
  it('creates article and retrieves it with author and categories', async () => {
    const author = await createTestUser({ role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id, { title: 'Big News Today' });

    const found = await findArticleBySlug(article.slug);
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Big News Today');
    expect(found!.author.name).toBe(author.name);
    expect(found!.categories.length).toBeGreaterThan(0);
    expect((found as Record<string, unknown>)['searchVector']).toBeUndefined();
  });
});

describe('findArticles', () => {
  it('filters by status', async () => {
    const author = await createTestUser({ role: 'author' });
    const cat = await createTestCategory();
    await createTestArticle(author.id, cat.id, { status: 'published' });
    await createTestArticle(author.id, cat.id, { status: 'draft' });

    const { items, total } = await findArticles({ status: 'published', limit: 10, offset: 0 });
    expect(total).toBe(1);
    expect(items[0]!.status).toBe('published');
  });

  it('filters by authorId', async () => {
    const author1 = await createTestUser({ role: 'author', email: 'a1@t.com' });
    const author2 = await createTestUser({ role: 'author', email: 'a2@t.com' });
    const cat = await createTestCategory();
    await createTestArticle(author1.id, cat.id);
    await createTestArticle(author2.id, cat.id);

    const { items } = await findArticles({ authorId: author1.id, limit: 10, offset: 0 });
    expect(items.length).toBe(1);
    expect(items[0]!.authorId).toBe(author1.id);
  });

  it('paginates correctly', async () => {
    const author = await createTestUser({ role: 'author' });
    const cat = await createTestCategory();
    await createTestArticle(author.id, cat.id, { status: 'published' });
    await createTestArticle(author.id, cat.id, { status: 'published' });
    await createTestArticle(author.id, cat.id, { status: 'published' });

    const { items: page1, total } = await findArticles({ status: 'published', limit: 2, offset: 0 });
    const { items: page2 } = await findArticles({ status: 'published', limit: 2, offset: 2 });

    expect(total).toBe(3);
    expect(page1.length).toBe(2);
    expect(page2.length).toBe(1);
  });
});

describe('updateArticle', () => {
  it('updates title and returns updated row', async () => {
    const author = await createTestUser({ role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    const updated = await updateArticle(article.id, { title: 'Updated Title' });
    expect(updated!.title).toBe('Updated Title');
  });
});

describe('deleteArticle', () => {
  it('deletes article and returns true', async () => {
    const author = await createTestUser({ role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    const result = await deleteArticle(article.id);
    expect(result).toBe(true);

    const found = await findArticleBySlug(article.slug);
    expect(found).toBeNull();
  });
});

describe('setArticleCategories', () => {
  it('replaces existing categories', async () => {
    const db = getTestDb();
    const author = await createTestUser({ role: 'author' });
    const cat1 = await createTestCategory({ name: 'Cat1', slug: 'cat1' });
    const cat2 = await createTestCategory({ name: 'Cat2', slug: 'cat2' });
    const article = await createTestArticle(author.id, cat1.id);

    await setArticleCategories(article.id, [cat2.id]);

    const rows = await db.select().from(articleCategories).where(eq(articleCategories.articleId, article.id));
    expect(rows.length).toBe(1);
    expect(rows[0]!.categoryId).toBe(cat2.id);
  });

  it('is idempotent', async () => {
    const db = getTestDb();
    const author = await createTestUser({ role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    await setArticleCategories(article.id, [cat.id]);
    await setArticleCategories(article.id, [cat.id]);

    const rows = await db.select().from(articleCategories).where(eq(articleCategories.articleId, article.id));
    expect(rows.length).toBe(1);
  });
});

describe('incrementArticleViews', () => {
  it('increments view count by 1', async () => {
    const author = await createTestUser({ role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);
    expect(article.views).toBe(0);

    await incrementArticleViews(article.id);
    await incrementArticleViews(article.id);

    const found = await findArticleById(article.id);
    expect(found!.views).toBe(2);
  });
});

describe('getArticleCounts', () => {
  it('returns 0 likes and comments initially', async () => {
    const author = await createTestUser({ role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    const { likeCount, commentCount } = await getArticleCounts(article.id);
    expect(likeCount).toBe(0);
    expect(commentCount).toBe(0);
  });
});

describe('searchArticles', () => {
  it('finds articles by keyword in title', async () => {
    const author = await createTestUser({ role: 'author' });
    const cat = await createTestCategory();
    await createTestArticle(author.id, cat.id, {
      title: 'Katsina Governor Visits School',
      content: 'The governor visited a school in Katsina today. '.repeat(10),
      status: 'published',
    });
    await createTestArticle(author.id, cat.id, {
      title: 'Sports Update Nigeria',
      content: 'Nigeria won the match yesterday. '.repeat(10),
      status: 'published',
    });

    const { items, total } = await searchArticles('Governor', 10, 0);
    expect(total).toBe(1);
    expect(items[0]!.title).toContain('Governor');
  });

  it('returns empty for no match', async () => {
    const author = await createTestUser({ role: 'author' });
    const cat = await createTestCategory();
    await createTestArticle(author.id, cat.id, { status: 'published' });

    const { total } = await searchArticles('xyznotexist', 10, 0);
    expect(total).toBe(0);
  });
});