// apps/api/src/tests/integration/queries/comment.queries.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDb, teardownTestDb, cleanTables } from '../../helpers/db.js';
import { createTestUser, createTestCategory, createTestArticle, createTestComment } from '../../helpers/factories.js';
import {
  findCommentsByArticle,
  findCommentById,
  createComment,
  updateComment,
  deleteComment,
  findCommentsByUser,
} from '../../../queries/comment.queries.js';

beforeAll(async () => { await setupTestDb(); });
afterAll(async () => { await teardownTestDb(); });
beforeEach(async () => { await cleanTables(); });

describe('comments CRUD', () => {
  it('creates and retrieves a comment with author', async () => {
    const user = await createTestUser();
    const author = await createTestUser({ email: 'a@t.com', role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    const comment = await createComment({ body: 'Great article!', userId: user.id, articleId: article.id });
    expect(comment.body).toBe('Great article!');
    expect(comment.user.name).toBe(user.name);
  });

  it('finds all comments for an article', async () => {
    const user = await createTestUser();
    const author = await createTestUser({ email: 'a2@t.com', role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    await createTestComment(user.id, article.id, 'Comment 1');
    await createTestComment(user.id, article.id, 'Comment 2');

    const { items, total } = await findCommentsByArticle(article.id, 10, 0);
    expect(total).toBe(2);
    expect(items.length).toBe(2);
  });

  it('updates a comment body', async () => {
    const user = await createTestUser();
    const author = await createTestUser({ email: 'a3@t.com', role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);
    const comment = await createTestComment(user.id, article.id);

    const updated = await updateComment(comment.id, 'Updated body');
    expect(updated!.body).toBe('Updated body');
  });

  it('deletes a comment', async () => {
    const user = await createTestUser();
    const author = await createTestUser({ email: 'a4@t.com', role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);
    const comment = await createTestComment(user.id, article.id);

    const result = await deleteComment(comment.id);
    expect(result).toBe(true);

    const found = await findCommentById(comment.id);
    expect(found).toBeNull();
  });

  it('finds comments by user', async () => {
    const user = await createTestUser();
    const author = await createTestUser({ email: 'a5@t.com', role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    await createTestComment(user.id, article.id, 'My comment');
    const results = await findCommentsByUser(user.id, 10, 0);
    expect(results.length).toBe(1);
  });
});