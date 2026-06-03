// apps/api/src/tests/unit/helpers/hash-password.test.ts
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../../src/helpers/hash-password.js';

describe('hashPassword', () => {
  it('returns a string different from the plain password', async () => {
    const hash = await hashPassword('Password123');
    expect(hash).not.toBe('Password123');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('produces different hashes for the same password', async () => {
    const hash1 = await hashPassword('Password123');
    const hash2 = await hashPassword('Password123');
    expect(hash1).not.toBe(hash2); // argon2 uses random salt
  });
});

describe('verifyPassword', () => {
  it('returns true for correct password', async () => {
    const hash = await hashPassword('CorrectPassword1');
    const result = await verifyPassword(hash, 'CorrectPassword1');
    expect(result).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('CorrectPassword1');
    const result = await verifyPassword(hash, 'WrongPassword1');
    expect(result).toBe(false);
  });

  it('returns false for empty password', async () => {
    const hash = await hashPassword('CorrectPassword1');
    const result = await verifyPassword(hash, '');
    expect(result).toBe(false);
  });
});