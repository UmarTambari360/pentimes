// apps/api/src/tests/unit/schemas/shared-schemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  RegisterSchema,
  LoginSchema,
  CreateArticleSchema,
  CreateCategorySchema,
  CreateCommentSchema,
  CreateProgramSchema,
} from '@pentimes/shared';

describe('Shared RegisterSchema', () => {
  it('matches API schema behaviour', () => {
    const r = RegisterSchema.safeParse({
      name: 'Ab',
      email: 'valid@test.com',
      password: 'Password1',
    });
    expect(r.success).toBe(true);
  });
});

describe('Shared CreateCategorySchema', () => {
  it('accepts valid category', () => {
    const r = CreateCategorySchema.safeParse({ name: 'Politics', slug: 'politics' });
    expect(r.success).toBe(true);
  });

  it('rejects name shorter than 2 chars', () => {
    const r = CreateCategorySchema.safeParse({ name: 'A' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid slug', () => {
    const r = CreateCategorySchema.safeParse({ name: 'Politics', slug: 'Not Valid!' });
    expect(r.success).toBe(false);
  });
});

describe('Shared CreateProgramSchema', () => {
  it('accepts valid program', () => {
    const r = CreateProgramSchema.safeParse({
      title: 'Morning Show',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: 60,
      status: 'upcoming',
    });
    expect(r.success).toBe(true);
  });

  it('rejects title shorter than 3 chars', () => {
    const r = CreateProgramSchema.safeParse({
      title: 'Hi',
      scheduledAt: new Date().toISOString(),
      durationMinutes: 30,
    });
    expect(r.success).toBe(false);
  });
});