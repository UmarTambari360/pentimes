// apps/web/src/tests/unit/form-schemas.test.ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the schemas from the forms (web-side validation)
const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and a number'),
});

const EditorSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(300),
  excerpt: z.string().max(500).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters and hyphens only').optional(),
  categoryIds: z.array(z.string()).min(1, 'Select at least one category'),
  status: z.enum(['draft', 'published']),
  coverImage: z.string().url().optional().or(z.literal('')),
});

describe('Login form schema', () => {
  it('accepts valid credentials', () => {
    expect(LoginSchema.safeParse({ email: 'a@b.com', password: 'pass' }).success).toBe(true);
  });
  it('rejects invalid email', () => {
    expect(LoginSchema.safeParse({ email: 'not-email', password: 'pass' }).success).toBe(false);
  });
  it('rejects empty password', () => {
    expect(LoginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('Register form schema', () => {
  const valid = { name: 'Ada Nwosu', email: 'ada@test.com', password: 'Password1' };
  it('accepts valid input', () => {
    expect(RegisterSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects name < 2 chars', () => {
    expect(RegisterSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
  });
  it('rejects weak password', () => {
    expect(RegisterSchema.safeParse({ ...valid, password: 'weak' }).success).toBe(false);
  });
});

describe('Article editor schema', () => {
  const valid = {
    title: 'My Great Article Title',
    categoryIds: ['cat-1'],
    status: 'draft' as const,
  };
  it('accepts valid input', () => {
    expect(EditorSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects title < 5 chars', () => {
    expect(EditorSchema.safeParse({ ...valid, title: 'Hi' }).success).toBe(false);
  });
  it('rejects empty categoryIds', () => {
    expect(EditorSchema.safeParse({ ...valid, categoryIds: [] }).success).toBe(false);
  });
  it('rejects invalid slug', () => {
    expect(EditorSchema.safeParse({ ...valid, slug: 'Bad Slug!' }).success).toBe(false);
  });
  it('accepts valid slug', () => {
    expect(EditorSchema.safeParse({ ...valid, slug: 'valid-slug' }).success).toBe(true);
  });
  it('accepts empty coverImage', () => {
    expect(EditorSchema.safeParse({ ...valid, coverImage: '' }).success).toBe(true);
  });
});