// apps/api/src/tests/integration/resolvers/comment.resolver.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setupTestDb, teardownTestDb, cleanTables } from '../../helpers/db.js';
import { gqlExecute } from '../../helpers/gql.js';
import { createTestUser, createTestCategory, createTestArticle, createTestComment } from '../../helpers/factories.js';

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

describe('createComment mutation', () => {
  it('requires authentication', async () => {
    const author = await createTestUser({ role: 'author', email: 'a@t.com' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    const result = await gqlExecute({
      query: `mutation CreateComment($input: CreateCommentInput!) {
        createComment(input: $input) { id body }
      }`,
      variables: { input: { articleId: article.id, body: 'A comment' } },
    });
    expect(result.errors).toBeDefined();
  });

  it('authenticated user can create a comment', async () => {
    const user = await createTestUser();
    const author = await createTestUser({ role: 'author', email: 'aut@t.com' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    const result = await gqlExecute({
      query: `mutation CreateComment($input: CreateCommentInput!) {
        createComment(input: $input) { id body author { name } }
      }`,
      variables: { input: { articleId: article.id, body: 'Interesting read!' } },
      userId: user.id,
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.createComment?.body).toBe('Interesting read!');
    expect(result.data?.createComment?.author?.name).toBe(user.name);
  });
});

describe('deleteComment mutation', () => {
  it('user can delete their own comment', async () => {
    const user = await createTestUser();
    const author = await createTestUser({ role: 'author', email: 'auth@t.com' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);
    const comment = await createTestComment(user.id, article.id);

    const result = await gqlExecute({
      query: `mutation DeleteComment($id: String!) { deleteComment(id: $id) }`,
      variables: { id: comment.id },
      userId: user.id,
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.deleteComment).toBe(true);
  });

  it('user cannot delete another user\'s comment', async () => {
    const user1 = await createTestUser({ email: 'u1@t.com' });
    const user2 = await createTestUser({ email: 'u2@t.com' });
    const author = await createTestUser({ role: 'author', email: 'aut2@t.com' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);
    const comment = await createTestComment(user1.id, article.id);

    const result = await gqlExecute({
      query: `mutation DeleteComment($id: String!) { deleteComment(id: $id) }`,
      variables: { id: comment.id },
      userId: user2.id,
    });
    expect(result.errors).toBeDefined();
  });
});