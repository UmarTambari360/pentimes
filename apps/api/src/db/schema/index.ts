/**
 * Barrel export for all schema files.
 * Import from this file everywhere in the API — never from individual
 * schema files directly (except within the schema/ folder itself).
 */
export * from './users.schema.js';
export * from './articles.schema.js';
export * from './categories.schema.js';
export * from './article-categories.schema.js';
export * from './comments.schema.js';
export * from './likes.schema.js';
export * from './bookmarks.schema.js';
export * from './scheduled-programs.schema.js';
export * from './relations.js';