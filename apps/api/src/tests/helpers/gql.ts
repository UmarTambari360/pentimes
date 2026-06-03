// apps/api/src/tests/helpers/gql.ts
/**
 * Lightweight GraphQL test executor.
 * Runs queries/mutations directly against the schema — no HTTP overhead.
 */
import { execute, parse } from 'graphql';
import { schema } from '../../graphql/schema.js';
import type { GraphQLContext } from '../../graphql/context.js';
import { db as realDb } from '../../config/db.js';
import { cacheService } from '../../services/redis.service.js';

type ExecuteOptions = {
  query: string;
  variables?: Record<string, unknown>;
  userId?: string;
  userRole?: 'reader' | 'author' | 'admin';
  userEmail?: string;
};

export async function gqlExecute({ query, variables, userId, userRole, userEmail }: ExecuteOptions) {
  const context: GraphQLContext = {
    db: realDb,
    cache: cacheService,
    currentUser: userId
      ? { id: userId, role: userRole ?? 'reader', email: userEmail ?? 'test@example.com' }
      : null,
  };

  const result = await execute({
    schema,
    document: parse(query),
    variableValues: variables,
    contextValue: context,
  });

  return result;
}