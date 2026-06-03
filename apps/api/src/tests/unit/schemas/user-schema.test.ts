// apps/api/src/tests/unit/schemas/user-schemas.test.ts
import { describe, it, expect } from 'vitest';
import { 
    RegisterSchema, 
    LoginSchema, 
    UpdateProfileSchema, 
    ChangePasswordSchema } from '../../../types/user.type.js';

describe('RegisterSchema', () => {
  const valid = { 
    name: 'Aisha Bello', 
    email: 'aisha@example.com', 
    password: 'Password123' };

  it('accepts valid input', () => {
    expect(RegisterSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects name shorter than 2 chars', () => {
    const r = RegisterSchema.safeParse({ ...valid, name: 'A' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('2 characters');
  });

  it('rejects invalid email', () => {
    const r = RegisterSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('rejects password shorter than 8 chars', () => {
    const r = RegisterSchema.safeParse({ ...valid, password: 'Abc1' });
    expect(r.success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    const r = RegisterSchema.safeParse({ ...valid, password: 'password123' });
    expect(r.success).toBe(false);
  });

  it('rejects password without lowercase', () => {
    const r = RegisterSchema.safeParse({ ...valid, password: 'PASSWORD123' });
    expect(r.success).toBe(false);
  });

  it('rejects password without a digit', () => {
    const r = RegisterSchema.safeParse({ ...valid, password: 'PasswordABC' });
    expect(r.success).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    const r = LoginSchema.safeParse({ email: 'user@example.com', password: 'any' });
    expect(r.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = LoginSchema.safeParse({ email: 'bad', password: 'pass' });
    expect(r.success).toBe(false);
  });

  it('rejects empty password', () => {
    const r = LoginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(r.success).toBe(false);
  });
});

describe('ChangePasswordSchema', () => {
  const valid = {
    currentPassword: 'OldPass1',
    newPassword: 'NewPass123',
    confirmPassword: 'NewPass123',
  };

  it('accepts matching passwords', () => {
    expect(ChangePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects non-matching confirmPassword', () => {
    const r = ChangePasswordSchema.safeParse({ ...valid, confirmPassword: 'Different1' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('match');
  });

  it('rejects weak new password', () => {
    const r = ChangePasswordSchema.safeParse({ ...valid, newPassword: 'weak', confirmPassword: 'weak' });
    expect(r.success).toBe(false);
  });
});