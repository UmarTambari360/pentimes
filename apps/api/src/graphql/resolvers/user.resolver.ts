import { builder }      from '../builder.js';
import { authService }  from '../../services/auth.service.js';
import { 
  findUserById, 
  findAllUsers, 
  updateUserRole }      from '../../queries/user.queries.js';
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

builder.queryField('me', (t) =>
  t.field({
    type: UserType,
    nullable: true,
    authScopes: { authenticated: true },
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.currentUser) return null;
      return findUserById(ctx.currentUser.id);
    },
  })
);

builder.queryField('user', (t) =>
  t.field({
    type: UserType,
    nullable: true,
    authScopes: { role: 'admin' },
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_parent, { id }) => findUserById(id),
  })
);

builder.queryField('users', (t) =>
  t.field({
    type: [UserType],
    authScopes: { role: 'admin' },
    resolve: async () => findAllUsers(),
  })
);

builder.mutationField('register', (t) =>
  t.field({
    type: AuthPayloadType,
    args: { input: t.arg({ type: RegisterInput, required: true }) },
    resolve: (_parent, { input }) => authService.register(input),
  })
);

builder.mutationField('login', (t) =>
  t.field({
    type: AuthPayloadType,
    args: { input: t.arg({ type: LoginInput, required: true }) },
    resolve: (_parent, { input }) => authService.login(input.email, input.password),
  })
);

builder.mutationField('logout', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.currentUser) return false;
      await authService.logout(ctx.currentUser.id);
      return true;
    },
  })
);

builder.mutationField('refreshToken', (t) =>
  t.field({
    type: AuthPayloadType,
    args: { token: t.arg.string({ required: true }) },
    resolve: async (_parent, { token }) => {
      const result = await authService.refreshTokens(token);
      if (!result.user) throw new GraphQLError('User not found');
      return result as { user: NonNullable<typeof result.user>; accessToken: string };
    },
  })
);

builder.mutationField('updateProfile', (t) =>
  t.field({
    type: UserType,
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: UpdateProfileInput, required: true }) },
    resolve: async (_parent, { input }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      const cleanInput: { name?: string; bio?: string | null; avatar?: string | null } = {};
      if (input.name != null)         cleanInput.name   = input.name;
      if (input.bio !== undefined)    cleanInput.bio    = input.bio ?? null;
      if (input.avatar !== undefined) cleanInput.avatar = input.avatar ?? null;
      const user = await authService.updateProfile(ctx.currentUser.id, cleanInput);
      if (!user) throw new GraphQLError('User not found');
      return user;
    },
  })
);

builder.mutationField('changePassword', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: ChangePasswordInput, required: true }) },
    resolve: async (_parent, { input }, ctx) => {
      if (!ctx.currentUser) throw new GraphQLError('Unauthorized');
      if (input.newPassword !== input.confirmPassword) {
        throw new GraphQLError('Passwords do not match');
      }
      await authService.changePassword(
        ctx.currentUser.id,
        input.currentPassword,
        input.newPassword
      );
      return true;
    },
  })
);

builder.mutationField('updateUserRole', (t) =>
  t.field({
    type: UserType,
    authScopes: { role: 'admin' },
    args: { input: t.arg({ type: UpdateUserRoleInput, required: true }) },
    resolve: async (_parent, { input }) => {
      const role = input.role as 'reader' | 'author' | 'admin';
      const user = await updateUserRole(input.userId, role);
      if (!user) throw new GraphQLError('User not found');
      return user;
    },
  })
);