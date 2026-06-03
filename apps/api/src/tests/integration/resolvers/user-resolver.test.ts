// apps/api/src/tests/integration/resolvers/user.resolver.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setupTestDb, teardownTestDb, cleanTables } from '../../helpers/db.js';
import { gqlExecute } from '../../helpers/gql.js';
import { createTestUser } from '../../helpers/factories.js';

vi.mock('../../../services/redis.service.js', () => ({
  cacheService: {
    setRefreshToken: vi.fn().mockResolvedValue(undefined),
    getRefreshToken: vi.fn().mockResolvedValue('tok'),
    deleteRefreshToken: vi.fn().mockResolvedValue(undefined),
    setSession: vi.fn().mockResolvedValue(undefined),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    delPattern: vi.fn().mockResolvedValue(undefined),
    invalidateArticleCache: vi.fn().mockResolvedValue(undefined),
    invalidateCategoryCache: vi.fn().mockResolvedValue(undefined),
  },
}));

beforeAll(async () => { await setupTestDb(); });
afterAll(async () => { await teardownTestDb(); });
beforeEach(async () => { await cleanTables(); });

describe('register mutation', () => {
  it('creates a user and returns accessToken', async () => {
    const result = await gqlExecute({
      query: `mutation Register($input: RegisterInput!) {
        register(input: $input) {
          user { id name email role }
          accessToken
        }
      }`,
      variables: { input: { name: 'Abubakar', email: 'abubakar@test.com', password: 'Password123' } },
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.register?.user?.email).toBe('abubakar@test.com');
    expect(typeof result.data?.register?.accessToken).toBe('string');
  });
});

describe('login mutation', () => {
  it('returns accessToken for valid credentials', async () => {
    await gqlExecute({
      query: `mutation Register($input: RegisterInput!) { register(input: $input) { accessToken } }`,
      variables: { input: { name: 'Binta', email: 'binta@test.com', password: 'Password123' } },
    });
    const result = await gqlExecute({
      query: `mutation Login($input: LoginInput!) { login(input: $input) { accessToken user { email } } }`,
      variables: { input: { email: 'binta@test.com', password: 'Password123' } },
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.login?.user?.email).toBe('binta@test.com');
  });

  it('returns error for wrong password', async () => {
    await gqlExecute({
      query: `mutation Register($input: RegisterInput!) { register(input: $input) { accessToken } }`,
      variables: { input: { name: 'Chidi', email: 'chidi@test.com', password: 'Password123' } },
    });
    const result = await gqlExecute({
      query: `mutation Login($input: LoginInput!) { login(input: $input) { accessToken } }`,
      variables: { input: { email: 'chidi@test.com', password: 'WrongPass1' } },
    });
    expect(result.errors).toBeDefined();
  });
});

describe('me query', () => {
  it('returns current user when authenticated', async () => {
    const user = await createTestUser({ email: 'me@test.com' });
    const result = await gqlExecute({
      query: `query Me { me { id email role } }`,
      userId: user.id,
      userEmail: user.email,
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.me?.email).toBe('me@test.com');
  });

  it('returns null when unauthenticated', async () => {
    const result = await gqlExecute({ query: `query Me { me { id } }` });
    // authScope: authenticated — returns error when not logged in
    expect(result.data?.me).toBeNull();
  });
});

describe('users query (admin only)', () => {
  it('returns all users for admin', async () => {
    await createTestUser({ email: 'u1@t.com' });
    await createTestUser({ email: 'u2@t.com' });
    const admin = await createTestUser({ email: 'adm@t.com', role: 'admin' });

    const result = await gqlExecute({
      query: `query Users { users { id email role } }`,
      userId: admin.id,
      userRole: 'admin',
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.users?.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects non-admin access', async () => {
    const user = await createTestUser();
    const result = await gqlExecute({
      query: `query Users { users { id } }`,
      userId: user.id,
      userRole: 'reader',
    });
    expect(result.errors).toBeDefined();
  });
});