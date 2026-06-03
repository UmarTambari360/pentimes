// apps/api/src/tests/unit/schemas/comment-schemas.test.ts
import { describe, it, expect } from 'vitest';
import { CreateCommentSchema } from '../../../types/comment.type.js';

describe('CreateCommentSchema', () => {
  const valid = {
    articleId: '00000000-0000-0000-0000-000000000001',
    body: 'This is a valid comment body.',
  };

  it('accepts valid input', () => {
    expect(CreateCommentSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty body', () => {
    const r = CreateCommentSchema.safeParse({ ...valid, body: '' });
    expect(r.success).toBe(false);
  });

  it('rejects body over 2000 chars', () => {
    const r = CreateCommentSchema.safeParse({ ...valid, body: 'x'.repeat(2001) });
    expect(r.success).toBe(false);
  });

  it('rejects invalid articleId UUID', () => {
    const r = CreateCommentSchema.safeParse({ ...valid, articleId: 'not-uuid' });
    expect(r.success).toBe(false);
  });
});