// apps/api/src/tests/integration/services/auth.service.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setupTestDb, teardownTestDb, cleanTables } from '../../helpers/db.js';
import { createTestUser } from '../../helpers/factories.js';
import { authService } from '../../../services/auth.service.js';

// Mock Redis to avoid needing a live Redis in unit/integration tests
vi.mock('../../../services/redis.service.js', () => ({
  cacheService: {
    setRefreshToken: vi.fn().mockResolvedValue(undefined),
    getRefreshToken: vi.fn().mockResolvedValue('mock-refresh-token'),
    deleteRefreshToken: vi.fn().mockResolvedValue(undefined),
    setSession: vi.fn().mockResolvedValue(undefined),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

beforeAll(async () => { await setupTestDb(); });
afterAll(async () => { await teardownTestDb(); });
beforeEach(async () => { await cleanTables(); });

describe('authService.register', () => {
  it('creates a user and returns accessToken', async () => {
    const result = await authService.register({
      name: 'Fatima Sani',
      email: 'fatima@example.com',
      password: 'Password123',
    });
    expect(result.user.email).toBe('fatima@example.com');
    expect(result.user.role).toBe('reader');
    expect(typeof result.accessToken).toBe('string');
    expect(result.accessToken.length).toBeGreaterThan(10);
    expect((result.user as Record<string, unknown>)['password']).toBeUndefined();
  });

  it('throws on duplicate email', async () => {
    await authService.register({ name: 'A', email: 'dup@test.com', password: 'Password1' });
    await expect(
      authService.register({ name: 'B', email: 'dup@test.com', password: 'Password1' })
    ).rejects.toThrow();
  });
});

describe('authService.login', () => {
  it('returns accessToken for valid credentials', async () => {
    await authService.register({ name: 'Musa', email: 'musa@test.com', password: 'Password123' });
    const result = await authService.login('musa@test.com', 'Password123');
    expect(result.user.email).toBe('musa@test.com');
    expect(typeof result.accessToken).toBe('string');
  });

  it('throws for wrong password', async () => {
    await authService.register({ name: 'Ibrahim', email: 'ib@test.com', password: 'Password123' });
    await expect(
      authService.login('ib@test.com', 'WrongPass1')
    ).rejects.toThrow();
  });

  it('throws for non-existent email', async () => {
    await expect(
      authService.login('ghost@test.com', 'Password123')
    ).rejects.toThrow();
  });
});

describe('authService.logout', () => {
  it('resolves without throwing', async () => {
    await expect(authService.logout('some-user-id')).resolves.toBeUndefined();
  });
});

describe('authService.updateProfile', () => {
  it('updates user name and bio', async () => {
    const { user } = await authService.register({
      name: 'Zainab',
      email: 'zainab@test.com',
      password: 'Password123',
    });
    const updated = await authService.updateProfile(user.id, { name: 'Zainab Updated', bio: 'New bio' });
    expect(updated.name).toBe('Zainab Updated');
    expect(updated.bio).toBe('New bio');
  });
});

describe('authService.changePassword', () => {
  it('throws for wrong current password', async () => {
    const { user } = await authService.register({
      name: 'Usman',
      email: 'usman@test.com',
      password: 'Password123',
    });
    await expect(
      authService.changePassword(user.id, 'WrongOldPass1', 'NewPassword1')
    ).rejects.toThrow();
  });

  it('succeeds with correct current password', async () => {
    const { user } = await authService.register({
      name: 'Halima',
      email: 'halima@test.com',
      password: 'Password123',
    });
    await expect(
      authService.changePassword(user.id, 'Password123', 'NewPassword1')
    ).resolves.toBeUndefined();
  });
});