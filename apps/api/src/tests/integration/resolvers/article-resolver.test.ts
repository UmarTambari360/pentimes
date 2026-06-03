// apps/api/src/tests/integration/resolvers/article.resolver.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setupTestDb, teardownTestDb, cleanTables } from '../../helpers/db.js';
import { gqlExecute } from '../../helpers/gql.js';
import { createTestUser, createTestCategory, createTestArticle } from '../../helpers/factories.js';

vi.mock('../../../services/redis.service.js', () => ({
  cacheService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    delPattern: vi.fn().mockResolvedValue(undefined),
    invalidateArticleCache: vi.fn().mockResolvedValue(undefined),
    invalidateCategoryCache: vi.fn().mockResolvedValue(undefined),
    setRefreshToken: vi.fn(),
    getRefreshToken: vi.fn(),
    deleteRefreshToken: vi.fn(),
    setSession: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

beforeAll(async () => { await setupTestDb(); });
afterAll(async () => { await teardownTestDb(); });
beforeEach(async () => { await cleanTables(); });

const ARTICLES_QUERY = `
  query Articles($filters: ArticleFiltersInput) {
    articles(filters: $filters) {
      items { id title slug status author { name } categories { name } }
      total hasMore
    }
  }
`;

const CREATE_ARTICLE = `
  mutation CreateArticle($input: CreateArticleInput!) {
    createArticle(input: $input) {
      id title slug status
    }
  }
`;

const DELETE_ARTICLE = `
  mutation DeleteArticle($id: String!) {
    deleteArticle(id: $id)
  }
`;

describe('articles query', () => {
  it('returns published articles without auth', async () => {
    const author = await createTestUser({ role: 'author', email: 'author@t.com' });
    const cat = await createTestCategory();
    await createTestArticle(author.id, cat.id, { status: 'published' });
    await createTestArticle(author.id, cat.id, { status: 'draft' });

    const result = await gqlExecute({ query: ARTICLES_QUERY });
    expect(result.errors).toBeUndefined();
    // default filter is published
    expect(result.data?.articles?.total).toBe(1);
  });

  it('paginates articles', async () => {
    const author = await createTestUser({ role: 'author', email: 'a@t.com' });
    const cat = await createTestCategory();
    for (let i = 0; i < 5; i++) {
      await createTestArticle(author.id, cat.id, { status: 'published' });
    }
    const result = await gqlExecute({
      query: ARTICLES_QUERY,
      variables: { filters: { status: 'published', limit: 2, offset: 0 } },
    });
    expect(result.data?.articles?.items?.length).toBe(2);
    expect(result.data?.articles?.total).toBe(5);
    expect(result.data?.articles?.hasMore).toBe(true);
  });
});

describe('createArticle mutation', () => {
  it('requires author role', async () => {
    const reader = await createTestUser({ email: 'reader@t.com' });
    const cat = await createTestCategory();

    const result = await gqlExecute({
      query: CREATE_ARTICLE,
      variables: {
        input: {
          title: 'My Article Title Here',
          content: 'x'.repeat(50),
          excerpt: 'A brief summary of the article for the listing page.',
          categoryIds: [cat.id],
          status: 'draft',
        },
      },
      userId: reader.id,
      userRole: 'reader',
    });
    expect(result.errors).toBeDefined();
  });

  it('creates article as author', async () => {
    const author = await createTestUser({ role: 'author', email: 'writer@t.com' });
    const cat = await createTestCategory();

    const result = await gqlExecute({
      query: CREATE_ARTICLE,
      variables: {
        input: {
          title: 'Breaking News From Katsina',
          content: 'x'.repeat(50),
          excerpt: 'A brief summary of the article for listing purposes here.',
          categoryIds: [cat.id],
          status: 'draft',
        },
      },
      userId: author.id,
      userRole: 'author',
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.createArticle?.title).toBe('Breaking News From Katsina');
  });
});

describe('deleteArticle mutation', () => {
  it('author can delete own article', async () => {
    const author = await createTestUser({ role: 'author', email: 'del@t.com' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    const result = await gqlExecute({
      query: DELETE_ARTICLE,
      variables: { id: article.id },
      userId: author.id,
      userRole: 'author',
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.deleteArticle).toBe(true);
  });

  it('author cannot delete another author\'s article', async () => {
    const author1 = await createTestUser({ role: 'author', email: 'a1@t.com' });
    const author2 = await createTestUser({ role: 'author', email: 'a2@t.com' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author1.id, cat.id);

    const result = await gqlExecute({
      query: DELETE_ARTICLE,
      variables: { id: article.id },
      userId: author2.id,
      userRole: 'author',
    });
    expect(result.errors).toBeDefined();
  });

  it('admin can delete any article', async () => {
    const author = await createTestUser({ role: 'author', email: 'writer2@t.com' });
    const admin = await createTestUser({ role: 'admin', email: 'admin@t.com' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    const result = await gqlExecute({
      query: DELETE_ARTICLE,
      variables: { id: article.id },
      userId: admin.id,
      userRole: 'admin',
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.deleteArticle).toBe(true);
  });
});