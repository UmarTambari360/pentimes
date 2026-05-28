import { z } from 'zod';
import type { LikeSelect } from '../db/schema/index.js';

export type Like = LikeSelect;

export const ToggleLikeSchema = z.object({
  articleId: z.string().uuid('Invalid article ID'),
});

export type ToggleLikeInput = z.infer<typeof ToggleLikeSchema>;

/**
 * Response shape for the toggleLike mutation.
 * Returns the new liked state and updated count so the frontend
 * can update the UI without a refetch.
 */
export type ToggleLikeResult = {
  liked: boolean;
  likeCount: number;
};