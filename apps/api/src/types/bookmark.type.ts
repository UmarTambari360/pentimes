import { z } from 'zod';
import type { BookmarkSelect } from '../db/schema/index.js';

export type Bookmark = BookmarkSelect;

export const ToggleBookmarkSchema = z.object({
  articleId: z.string().uuid('Invalid article ID'),
});

export type ToggleBookmarkInput = z.infer<typeof ToggleBookmarkSchema>;

export type ToggleBookmarkResult = {
  bookmarked: boolean;
};