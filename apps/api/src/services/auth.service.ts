import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
} from '../queries/user.queries.js';
import { cacheService } from './redis.service.js';
import { GraphQLError } from 'graphql';
import type { UserRole } from '@pentimes/shared';

// ──────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ──────────────────────────────────────────────────────────────────
// Token Helpers
// ──────────────────────────────────────────────────────────────────

function signAccessToken(payload: { sub: string; email: string; role: UserRole }): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
}

function signRefreshToken(payload: { sub: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
}

/**
 * Verifies access token and returns decoded payload.
 * Throws error if token is invalid/expired.
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (err) {
    throw new Error('Invalid or expired token'); // Will be caught in middleware
  }
}

// ──────────────────────────────────────────────────────────────────
// Auth Service
// ──────────────────────────────────────────────────────────────────

export const authService = {
  async register(input: { name: string; email: string; password: string }) {
    const existing = await findUserByEmail(input.email);
    if (existing) throw new GraphQLError('Email already in use', { extensions: { code: 'CONFLICT' } });

    const hashedPassword = await argon2.hash(input.password);
    const user = await createUser({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    const { password: _, ...publicUser } = user;
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });

    await cacheService.setRefreshToken(user.id, refreshToken);
    await cacheService.setSession(user.id, { id: user.id, role: user.role, email: user.email });

    return { user: publicUser, accessToken };
  },

  async login(email: string, password: string) {
    const user = await findUserByEmail(email);
    if (!user) throw new GraphQLError('Invalid email or password', { extensions: { code: 'UNAUTHORIZED' } });

    const valid = await argon2.verify(user.password, password);
    if (!valid) throw new GraphQLError('Invalid email or password', { extensions: { code: 'UNAUTHORIZED' } });

    const { password: _, ...publicUser } = user;
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });

    await cacheService.setRefreshToken(user.id, refreshToken);
    await cacheService.setSession(user.id, { id: user.id, role: user.role, email: user.email });

    return { user: publicUser, accessToken };
  },

  async logout(userId: string): Promise<void> {
    await Promise.all([
      cacheService.deleteRefreshToken(userId),
      cacheService.deleteSession(userId),
    ]);
  },

  async refreshTokens(token: string) {
    let payload: { sub: string };
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
    } catch {
      throw new GraphQLError('Invalid or expired refresh token', { extensions: { code: 'UNAUTHORIZED' } });
    }

    const stored = await cacheService.getRefreshToken(payload.sub);
    if (!stored || stored !== token) {
      throw new GraphQLError('Refresh token revoked', { extensions: { code: 'UNAUTHORIZED' } });
    }

    const user = await findUserById(payload.sub);
    if (!user) throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ sub: user.id });

    await cacheService.setRefreshToken(user.id, newRefreshToken);

    return { user, accessToken };
  },

  async updateProfile(userId: string, data: { name?: string | null; bio?: string | null; avatar?: string | null }) {
    const updates: Parameters<typeof updateUser>[1] = {};
    if (data.name !== undefined && data.name !== null) updates.name = data.name;
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.avatar !== undefined) updates.avatar = data.avatar;

    const user = await updateUser(userId, updates);
    if (!user) throw new GraphQLError('User not found');
    return user;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await findUserById(userId);
    if (!user) throw new GraphQLError('User not found');

    const fullUser = await findUserByEmail(user.email);
    if (!fullUser) throw new GraphQLError('User not found');

    const valid = await argon2.verify(fullUser.password, currentPassword);
    if (!valid) throw new GraphQLError('Current password is incorrect', { extensions: { code: 'BAD_REQUEST' } });

    const hashed = await argon2.hash(newPassword);
    await updateUser(userId, { password: hashed });
    await cacheService.deleteRefreshToken(userId);
  },
};