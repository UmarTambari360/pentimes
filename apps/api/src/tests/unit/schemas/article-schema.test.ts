// apps/api/src/tests/unit/schemas/article-schemas.test.ts
import { describe, it, expect } from 'vitest';
import { CreateArticleSchema, UpdateArticleSchema } from '../../../types/article.type.js';

const validCreate = {
  title: 'Breaking: Katsina Governor Announces Development Plan',
  excerpt: 'A detailed excerpt about the plan that is at least 20 characters.',
  content: 'x'.repeat(50),
  status: 'draft' as const,
  categoryIds: ['00000000-0000-0000-0000-000000000001'],
};

describe('CreateArticleSchema', () => {
  it('accepts valid input', () => {
    expect(CreateArticleSchema.safeParse(validCreate).success).toBe(true);
  });

  it('rejects title shorter than 5 chars', () => {
    const r = CreateArticleSchema.safeParse({ ...validCreate, title: 'Hi' });
    expect(r.success).toBe(false);
  });

  it('rejects empty categoryIds', () => {
    const r = CreateArticleSchema.safeParse({ ...validCreate, categoryIds: [] });
    expect(r.success).toBe(false);
  });

  it('rejects more than 5 categories', () => {
    const r = CreateArticleSchema.safeParse({
      ...validCreate,
      categoryIds: Array(6).fill('00000000-0000-0000-0000-000000000001'),
    });
    expect(r.success).toBe(false);
  });

  it('rejects invalid slug format', () => {
    const r = CreateArticleSchema.safeParse({ ...validCreate, slug: 'Invalid Slug!' });
    expect(r.success).toBe(false);
  });

  it('accepts valid slug', () => {
    const r = CreateArticleSchema.safeParse({ ...validCreate, slug: 'valid-slug-123' });
    expect(r.success).toBe(true);
  });

  it('accepts published status', () => {
    const r = CreateArticleSchema.safeParse({ ...validCreate, status: 'published' });
    expect(r.success).toBe(true);
  });

  it('rejects content shorter than 50 chars', () => {
    const r = CreateArticleSchema.safeParse({ ...validCreate, content: 'too short' });
    expect(r.success).toBe(false);
  });
});

describe('UpdateArticleSchema', () => {
  it('accepts partial updates', () => {
    const r = UpdateArticleSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Updated Title Here',
    });
    expect(r.success).toBe(true);
  });

  it('requires a valid UUID id', () => {
    const r = UpdateArticleSchema.safeParse({ id: 'not-a-uuid', title: 'Title' });
    expect(r.success).toBe(false);
  });
});