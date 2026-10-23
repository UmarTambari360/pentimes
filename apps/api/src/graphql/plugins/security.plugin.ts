// WHY this file exists:
//   Two production hardening measures for the GraphQL endpoint, implemented as
//   graphql-js validation rules so they run BEFORE any resolver executes:
//
//     1. Introspection blocking   — hides __schema / __type from attackers.
//     2. Query depth limiting     — rejects abnormally deeply nested queries.
//
//   Both use only `graphql` (already a dependency) — no extra packages, so the
//   lockfile and the Docker `--frozen-lockfile` install are unaffected.

import {
  GraphQLError,
  Kind,
  NoSchemaIntrospectionCustomRule,
  type ASTVisitor,
  type FragmentDefinitionNode,
  type SelectionSetNode,
  type ValidationContext,
  type ValidationRule,
} from 'graphql';
import type { Plugin } from 'graphql-yoga';

/**
 * Builds a validation rule that rejects operations nested deeper than `maxDepth`.
 *
 * Depth counting: every field is one level, so `{ articles { items { author { id } } } }`
 * has depth 4. Fragment spreads and inline fragments add no depth of their own,
 * but the fields inside them are counted. Introspection meta-fields (`__schema`,
 * `__type`, `__typename`) are ignored — in production they are blocked by the
 * introspection rule, and in development GraphiQL's own queries must keep working.
 */
export function createDepthLimitRule(maxDepth: number): ValidationRule {
  return (context: ValidationContext): ASTVisitor => {
    const fragments = new Map<string, FragmentDefinitionNode>();
    for (const definition of context.getDocument().definitions) {
      if (definition.kind === Kind.FRAGMENT_DEFINITION) {
        fragments.set(definition.name.value, definition);
      }
    }

    // Memoised per fragment so a document that spreads the same fragment many
    // times cannot make this rule itself expensive to evaluate.
    const fragmentDepthCache = new Map<string, number>();

    const measure = (selectionSet: SelectionSetNode, visiting: Set<string>): number => {
      let deepest = 0;

      for (const selection of selectionSet.selections) {
        switch (selection.kind) {
          case Kind.FIELD: {
            if (selection.name.value.startsWith('__')) break;
            const childDepth = selection.selectionSet
              ? measure(selection.selectionSet, visiting)
              : 0;
            deepest = Math.max(deepest, 1 + childDepth);
            break;
          }

          case Kind.INLINE_FRAGMENT: {
            deepest = Math.max(deepest, measure(selection.selectionSet, visiting));
            break;
          }

          case Kind.FRAGMENT_SPREAD: {
            const name = selection.name.value;
            // Cycles are reported by graphql-js's own NoFragmentCycles rule.
            if (visiting.has(name)) break;

            const cached = fragmentDepthCache.get(name);
            if (cached !== undefined) {
              deepest = Math.max(deepest, cached);
              break;
            }

            const fragment = fragments.get(name);
            if (!fragment) break; // reported by KnownFragmentNames

            visiting.add(name);
            const fragmentDepth = measure(fragment.selectionSet, visiting);
            visiting.delete(name);

            fragmentDepthCache.set(name, fragmentDepth);
            deepest = Math.max(deepest, fragmentDepth);
            break;
          }
        }
      }

      return deepest;
    };

    return {
      OperationDefinition(node) {
        const depth = measure(node.selectionSet, new Set());
        if (depth > maxDepth) {
          context.reportError(
            new GraphQLError(
              `Query is too deep: depth ${depth} exceeds the maximum allowed depth of ${maxDepth}.`,
              { nodes: [node], extensions: { code: 'QUERY_TOO_DEEP' } }
            )
          );
        }
      },
    };
  };
}

export interface GraphQLSecurityOptions {
  /** Maximum allowed query depth. */
  maxDepth: number;
  /** When true, `__schema` and `__type` queries are rejected. */
  disableIntrospection: boolean;
}

/** Yoga plugin that registers the security validation rules. */
export function useGraphQLSecurity(options: GraphQLSecurityOptions): Plugin {
  return {
    onValidate({ addValidationRule }) {
      addValidationRule(createDepthLimitRule(options.maxDepth));
      if (options.disableIntrospection) {
        addValidationRule(NoSchemaIntrospectionCustomRule);
      }
    },
  };
}
