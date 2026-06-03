// apps/api/src/tests/integration/queries/like-bookmark.queries.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDb, teardownTestDb, cleanTables } from '../../helpers/db.js';
import { createTestUser, createTestCategory, createTestArticle } from '../../helpers/factories.js';
import { findLike, createLike, deleteLike, countLikes } from '../../../queries/like.queries.js';
import { findBookmark, createBookmark, deleteBookmark, findBookmarksByUser } from '../../../queries/bookmark.queries.js';

beforeAll(async () => { await setupTestDb(); });
afterAll(async () => { await teardownTestDb(); });
beforeEach(async () => { await cleanTables(); });

describe('likes', () => {
  it('creates, finds, counts, and deletes a like', async () => {
    const user = await createTestUser();
    const author = await createTestUser({ email: 'auth@t.com', role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    expect(await findLike(user.id, article.id)).toBeNull();
    expect(await countLikes(article.id)).toBe(0);

    await createLike(user.id, article.id);
    expect(await findLike(user.id, article.id)).not.toBeNull();
    expect(await countLikes(article.id)).toBe(1);

    const deleted = await deleteLike(user.id, article.id);
    expect(deleted).toBe(true);
    expect(await findLike(user.id, article.id)).toBeNull();
    expect(await countLikes(article.id)).toBe(0);
  });
});

describe('bookmarks', () => {
  it('creates, finds, and deletes a bookmark', async () => {
    const user = await createTestUser();
    const author = await createTestUser({ email: 'aut@t.com', role: 'author' });
    const cat = await createTestCategory();
    const article = await createTestArticle(author.id, cat.id);

    expect(await findBookmark(user.id, article.id)).toBeNull();

    await createBookmark(user.id, article.id);
    expect(await findBookmark(user.id, article.id)).not.toBeNull();

    const bookmarks = await findBookmarksByUser(user.id, 10, 0);
    expect(bookmarks.length).toBe(1);

    const deleted = await deleteBookmark(user.id, article.id);
    expect(deleted).toBe(true);
    expect(await findBookmark(user.id, article.id)).toBeNull();
  });
});