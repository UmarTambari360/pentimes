import SchemaBuilder            from '@pothos/core';
import ErrorsPlugin             from '@pothos/plugin-errors';
import ScopeAuthPlugin          from '@pothos/plugin-scope-auth';
import RelayPlugin              from '@pothos/plugin-relay';
import type { GraphQLContext }  from './context.js';
import type { UserRole }        from '@pentimes/shared';
import { GraphQLError }         from 'graphql';

export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  AuthScopes: {
    authenticated: boolean;
    role: UserRole;
    // can be used like: .authScope('isAdmin')
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

    // Clients use the UNAUTHENTICATED code to know they should refresh their
    // session and retry. A logged-in user lacking permission gets FORBIDDEN.
    unauthorizedError: (_parent, ctx) =>
      ctx.currentUser
        ? new GraphQLError('You do not have permission to perform this action', {
            extensions: { code: 'FORBIDDEN' },
          })
        : new GraphQLError('You must be logged in to perform this action', {
            extensions: { code: 'UNAUTHENTICATED' },
          }),
  },

  errors: {
    defaultTypes: [Error],
  },

  relay: {},
});

builder.queryType({});
builder.mutationType({});