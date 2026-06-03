// apps/api/src/tests/integration/resolvers/like-bookmark.resolver.test.ts
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

const TOGGLE_LIKE = `
  mutation ToggleLike($articleId: String!) {
    toggleLike(articleId: $articleId) { liked likeCount }
  }
`;

const TOGGLE_BOOKMARK = `
  mutation ToggleBookmark($articleId: String!) {
    toggleBookmark(articleId: $articleId) { bookmarked }
  }
`;

describe('toggleLike', () => {
  it('requires authentication', async () => {
    const author = await createTestUser({ role: 'author', email: 'a@t.com' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    const result = await gqlExecute({ query: TOGGLE_LIKE, variables: { articleId: article.id } });
    expect(result.errors).toBeDefined();
  });

  it('likes then unlikes an article', async () => {
    const user = await createTestUser();
    const author = await createTestUser({ role: 'author', email: 'aut@t.com' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    const like = await gqlExecute({ query: TOGGLE_LIKE, variables: { articleId: article.id }, userId: user.id });
    expect(like.data?.toggleLike?.liked).toBe(true);
    expect(like.data?.toggleLike?.likeCount).toBe(1);

    const unlike = await gqlExecute({ query: TOGGLE_LIKE, variables: { articleId: article.id }, userId: user.id });
    expect(unlike.data?.toggleLike?.liked).toBe(false);
    expect(unlike.data?.toggleLike?.likeCount).toBe(0);
  });
});

describe('toggleBookmark', () => {
  it('bookmarks then removes bookmark', async () => {
    const user = await createTestUser();
    const author = await createTestUser({ role: 'author', email: 'au@t.com' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    const bm = await gqlExecute({ query: TOGGLE_BOOKMARK, variables: { articleId: article.id }, userId: user.id });
    expect(bm.data?.toggleBookmark?.bookmarked).toBe(true);

    const rm = await gqlExecute({ query: TOGGLE_BOOKMARK, variables: { articleId: article.id }, userId: user.id });
    expect(rm.data?.toggleBookmark?.bookmarked).toBe(false);
  });
});