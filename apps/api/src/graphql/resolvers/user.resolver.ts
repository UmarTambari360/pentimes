// apps/api/src/graphql/resolvers/user.resolver.ts
import { builder }      from '../builder.js';
import { authService }  from '../../services/auth.service.js';
import {
  findUserById,
  findAllUsers,
  updateUserRole,
}                       from '../../queries/user.queries.js';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
  UpdateUserRoleInput,
}                       from '../inputs.js';
import '../typedefs/user.typedef.js';
import { UserType, AuthPayloadType } from '../typedefs/user.typedef.js';
import { GraphQLError }              from 'graphql';
import { ApiError }                  from '../../middleware/errorHandler.middleware.js';
import { logger }                    from '../../helpers/logger.js';

builder.queryField('me', (t) =>
  t.field({
    type: UserType,
    nullable: true,
    authScopes: { authenticated: true },
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.currentUser) return null;
      try {
        return await findUserById(ctx.currentUser.id);
      } catch (err) {
        logger.error('me query failed', {
          userId: ctx.currentUser.id,
          error: err instanceof Error ? err.message : String(err),
        });
        throw new GraphQLError('Failed to fetch user profile.');
      }
    },
  }),
);

builder.queryField('user', (t) =>
  t.field({
    type: UserType,
    nullable: true,
    authScopes: { role: 'admin' },
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_parent, { id }) => {
      try {
        return await findUserById(id);
      } catch (err) {
        logger.error('user query failed', { userId: id, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to fetch user.');
      }
    },
  }),
);

builder.queryField('users', (t) =>
  t.field({
    type: [UserType],
    authScopes: { role: 'admin' },
    resolve: async () => {
      try {
        return await findAllUsers();
      } catch (err) {
        logger.error('users query failed', { error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to fetch users.');
      }
    },
  }),
);

builder.mutationField('register', (t) =>
  t.field({
    type: AuthPayloadType,
    args: { input: t.arg({ type: RegisterInput, required: true }) },
    resolve: async (_parent, { input }) => {
      try {
        return await authService.register(input);
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('register mutation failed', { email: input.email, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Registration failed. Please try again.');
      }
    },
  }),
);

builder.mutationField('login', (t) =>
  t.field({
    type: AuthPayloadType,
    args: { input: t.arg({ type: LoginInput, required: true }) },
    resolve: async (_parent, { input }) => {
      try {
        return await authService.login(input.email, input.password);
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('login mutation failed', { email: input.email, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Login failed. Please check your credentials.');
      }
    },
  }),
);

builder.mutationField('logout', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.currentUser) return false;
      try {
        await authService.logout(ctx.currentUser.id);
        return true;
      } catch (err) {
        logger.error('logout mutation failed', { userId: ctx.currentUser.id, error: err instanceof Error ? err.message : String(err) });
        // Logout failures should not block the user — return true anyway.
        return true;
      }
    },
  }),
);

builder.mutationField('refreshToken', (t) =>
  t.field({
    type: AuthPayloadType,
    args: { token: t.arg.string({ required: true }) },
    resolve: async (_parent, { token }) => {
      try {
        const result = await authService.refreshTokens(token);
        if (!result.user) throw new GraphQLError('User not found.');
        return result as { user: NonNullable<typeof result.user>; accessToken: string };
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('refreshToken mutation failed', { error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Token refresh failed. Please log in again.');
      }
    },
  }),
);

builder.mutationField('updateProfile', (t) =>
  t.field({
    type: UserType,
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: UpdateProfileInput, required: true }) },
    resolve: async (_parent, { input }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      try {
        const cleanInput: { name?: string; bio?: string | null; avatar?: string | null } = {};
        if (input.name   != null)    cleanInput.name   = input.name;
        if (input.bio    !== undefined) cleanInput.bio  = input.bio    ?? null;
        if (input.avatar !== undefined) cleanInput.avatar = input.avatar ?? null;
        const user = await authService.updateProfile(ctx.currentUser.id, cleanInput);
        if (!user) throw new GraphQLError('User not found.');
        return user;
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('updateProfile mutation failed', { userId: ctx.currentUser.id, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to update profile. Please try again.');
      }
    },
  }),
);

builder.mutationField('changePassword', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: ChangePasswordInput, required: true }) },
    resolve: async (_parent, { input }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      if (input.newPassword !== input.confirmPassword) {
        throw new GraphQLError('New passwords do not match.');
      }
      try {
        await authService.changePassword(
          ctx.currentUser.id,
          input.currentPassword,
          input.newPassword,
        );
        return true;
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('changePassword mutation failed', { userId: ctx.currentUser.id, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to change password. Please try again.');
      }
    },
  }),
);

builder.mutationField('updateUserRole', (t) =>
  t.field({
    type: UserType,
    authScopes: { role: 'admin' },
    args: { input: t.arg({ type: UpdateUserRoleInput, required: true }) },
    resolve: async (_parent, { input }) => {
      try {
        const role = input.role as 'reader' | 'author' | 'admin';
        const user = await updateUserRole(input.userId, role);
        if (!user) throw new GraphQLError('User not found.');
        return user;
      } catch (err) {
        if (err instanceof GraphQLError || err instanceof ApiError) throw err;
        logger.error('updateUserRole mutation failed', { userId: input.userId, error: err instanceof Error ? err.message : String(err) });
        throw new GraphQLError('Failed to update user role.');
      }
    },
  }),
);