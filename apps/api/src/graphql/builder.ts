import SchemaBuilder            from '@pothos/core';
import ErrorsPlugin             from '@pothos/plugin-errors';
import ScopeAuthPlugin          from '@pothos/plugin-scope-auth';
import RelayPlugin              from '@pothos/plugin-relay';
import type { GraphQLContext }  from './context.js';
import type { UserRole }        from '@pentimes/shared';

export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  AuthScopes: {
    authenticated: boolean;
    role: UserRole;
    // Optional but very useful — can be used like: .authScope('isAdmin')
    isAdmin: boolean;
    isAuthor: boolean;
  };
  DefaultEdgesNullability: false;
  DefaultNodeNullability: false;
}>({
  plugins: [ScopeAuthPlugin, ErrorsPlugin, RelayPlugin],

  scopeAuth: {
    authScopes: (ctx) => ({
      authenticated: ctx.currentUser !== null,
      role: (role: UserRole) => ctx.currentUser?.role === role,

      // Convenience scopes
      isAdmin: ctx.currentUser?.role === 'admin',
      isAuthor: ctx.currentUser?.role === 'author' || ctx.currentUser?.role === 'admin',
    }),

    unauthorizedError: () => new Error('You must be logged in to perform this action'),
  },

  errors: {
    defaultTypes: [Error],
  },

  relay: {},
});

builder.queryType({});
builder.mutationType({});