// import jwt              from 'jsonwebtoken';
// import { env }      from '../config/env.js';
// import { cacheService } from './redis.service.js';
// import { hashPassword, verifyPassword } from '../helpers/hash-password.js';
// import {
//   findUserByEmail,
//   findUserById,
//   findPrivateUserById,
//   createUser,
//   emailExists,
//   updateUser,
// } from '../queries/user.queries.js';
// import { ApiError } from '../middleware/errorHandler.middleware.js';
// import type { RegisterInput, LoginInput, ChangePasswordInput } from '../types/user.type.js';
// import type { PublicUser } from '../types/user.type.js';
// import type { UserRole } from '@pentimes/shared';

// export interface JwtPayload {
//   sub: string;
//   email: string;
//   role: UserRole;
//   iat: number;
//   exp: number;
// }

// export interface AuthPayload {
//   user: PublicUser;
//   accessToken: string;
// }

// function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
//   return jwt.sign(payload, env.JWT_SECRET, {
//     expiresIn: env.JWT_ACCESS_EXPIRY,
//   } as jwt.SignOptions);
// }

// function signRefreshToken(userId: string): string {
//   return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
//     expiresIn: env.JWT_REFRESH_EXPIRY,
//   } as jwt.SignOptions);
// }

// export function verifyAccessToken(token: string): JwtPayload {
//   try {
//     return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
//   } catch {
//     throw ApiError.unauthorized('Invalid or expired access token');
//   }
// }

// export function verifyRefreshToken(token: string): { sub: string } {
//   try {
//     return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
//   } catch {
//     throw ApiError.unauthorized('Invalid or expired refresh token');
//   }
// }

// export async function register(input: RegisterInput): Promise<AuthPayload> {
//   const exists = await emailExists(input.email);
//   if (exists) throw ApiError.conflict('An account with this email already exists');

//   const hashedPassword = await hashPassword(input.password);
//   const user = await createUser({
//     name: input.name,
//     email: input.email,
//     password: hashedPassword,
//     role: 'reader',
//   });

//   const accessToken = signAccessToken({
//     sub: user.id,
//     email: user.email,
//     role: user.role,
//   });
//   const refreshToken = signRefreshToken(user.id);

//   await cacheService.setRefreshToken(user.id, refreshToken);
//   await cacheService.setSession(user.id, {
//     id: user.id,
//     role: user.role,
//     email: user.email,
//   });

//   return { user, accessToken };
// }

// export async function login(input: LoginInput): Promise<AuthPayload & { refreshToken: string }> {
//   const privateUser = await findUserByEmail(input.email);
//   if (!privateUser) throw ApiError.unauthorized('Invalid email or password');

//   const valid = await verifyPassword(privateUser.password, input.password);
//   if (!valid) throw ApiError.unauthorized('Invalid email or password');

//   const { password: _, ...user } = privateUser;

//   const accessToken = signAccessToken({
//     sub: user.id,
//     email: user.email,
//     role: user.role,
//   });
//   const refreshToken = signRefreshToken(user.id);

//   await cacheService.setRefreshToken(user.id, refreshToken);
//   await cacheService.setSession(user.id, {
//     id: user.id,
//     role: user.role,
//     email: user.email,
//   });

//   return { user, accessToken, refreshToken };
// }

// export async function logout(userId: string): Promise<void> {
//   await Promise.all([
//     cacheService.deleteRefreshToken(userId),
//     cacheService.deleteSession(userId),
//   ]);
// }

// export async function refreshTokens(
//   token: string
// ): Promise<AuthPayload & { refreshToken: string }> {
//   const payload = verifyRefreshToken(token);
//   const userId = payload.sub;

//   const stored = await cacheService.getRefreshToken(userId);
//   if (!stored || stored !== token) {
//     throw ApiError.unauthorized('Refresh token is invalid or has been revoked');
//   }

//   const user = await findUserById(userId);
//   if (!user) throw ApiError.unauthorized('User not found');

//   const newAccessToken = signAccessToken({
//     sub: user.id,
//     email: user.email,
//     role: user.role,
//   });
//   const newRefreshToken = signRefreshToken(user.id);

//   await cacheService.setRefreshToken(user.id, newRefreshToken);

//   return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
// }

// export async function getMe(userId: string): Promise<PublicUser> {
//   const cached = await cacheService.getSession(userId);
//   if (cached) {
//     const user = await findUserById(userId);
//     if (user) return user;
//   }

//   const user = await findUserById(userId);
//   if (!user) throw ApiError.notFound('User');
//   return user;
// }

// export async function changePassword(
//   userId: string,
//   input: ChangePasswordInput
// ): Promise<void> {
//   const privateUser = await findPrivateUserById(userId);
//   if (!privateUser) throw ApiError.notFound('User');

//   const valid = await verifyPassword(privateUser.password, input.currentPassword);
//   if (!valid) throw ApiError.badRequest('Current password is incorrect', 'currentPassword');

//   const newHash = await hashPassword(input.newPassword);
//   await updateUser(userId, { password: newHash });

//   await Promise.all([
//     cacheService.deleteRefreshToken(userId),
//     cacheService.deleteSession(userId),
//   ]);
// }