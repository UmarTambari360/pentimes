import { builder } from '../builder.js';
import type { ToggleBookmarkResult } from '../../types/bookmark.type.js';

export const ToggleBookmarkResultType = builder
.objectRef<ToggleBookmarkResult>('ToggleBookmarkResult')
.implement({
  fields: (t) => ({
    bookmarked: t.exposeBoolean('bookmarked'),
  }),
});