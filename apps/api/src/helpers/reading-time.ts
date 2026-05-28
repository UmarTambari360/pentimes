import { READING_TIME } from '@pentimes/shared';

export function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / READING_TIME.WORDS_PER_MINUTE));
}