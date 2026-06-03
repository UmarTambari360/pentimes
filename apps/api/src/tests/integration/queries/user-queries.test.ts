// apps/api/src/tests/integration/queries/user.queries.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDb, teardownTestDb, cleanTables } from '../../helpers/db.js';
import { findUserByEmail, findUserById, createUser, updateUser, findAllUsers } from '../../../queries/user.queries.js';

beforeAll(async () => { await setupTestDb(); });
afterAll(async () => { await teardownTestDb(); });
beforeEach(async () => { await cleanTables(); });

describe('createUser', () => {
  it('inserts a user and returns it without password', async () => {
    const user = await createUser({
      name: 'Amina Yusuf',
      email: 'amina@example.com',
      password: 'hashedpassword',
    });
    expect(user).toBeDefined();
    expect(user!.email).toBe('amina@example.com');
    expect(user!.role).toBe('reader');
  });

  it('defaults role to reader', async () => {
    const user = await createUser({ name: 'X', email: 'x@x.com', password: 'hash' });
    expect(user!.role).toBe('reader');
  });
});

describe('findUserByEmail', () => {
  it('returns user with password (for auth)', async () => {
    await createUser({ name: 'Bob', email: 'bob@test.com', password: 'hash123' });
    const user = await findUserByEmail('bob@test.com');
    expect(user).not.toBeNull();
    expect(user!.email).toBe('bob@test.com');
    expect(user!.password).toBe('hash123');
  });

  it('returns null for non-existent email', async () => {
    const user = await findUserByEmail('ghost@test.com');
    expect(user).toBeNull();
  });
});

describe('findUserById', () => {
  it('returns user without password', async () => {
    const created = await createUser({ name: 'Carol', email: 'carol@test.com', password: 'hash' });
    const found = await findUserById(created!.id);
    expect(found).not.toBeNull();
    expect((found as Record<string, unknown>)['password']).toBeUndefined();
  });

  it('returns null for non-existent id', async () => {
    const found = await findUserById('00000000-0000-0000-0000-000000000999');
    expect(found).toBeNull();
  });
});

describe('updateUser', () => {
  it('updates user name and bio', async () => {
    const user = await createUser({ name: 'Dave', email: 'dave@test.com', password: 'hash' });
    const updated = await updateUser(user!.id, { name: 'David', bio: 'My bio' });
    expect(updated!.name).toBe('David');
    expect(updated!.bio).toBe('My bio');
  });
});

describe('findAllUsers', () => {
  it('returns all users ordered by createdAt desc', async () => {
    await createUser({ name: 'A', email: 'a@test.com', password: 'h' });
    await createUser({ name: 'B', email: 'b@test.com', password: 'h' });
    const all = await findAllUsers();
    expect(all.length).toBe(2);
    all.forEach(u => expect((u as Record<string, unknown>)['password']).toBeUndefined());
  });
});