import { builder } from '../builder.js';
import type { ToggleLikeResult } from '../../types/like.type.ts';

export const ToggleLikeResultType = builder
  .objectRef<ToggleLikeResult>('ToggleLikeResult')
  .implement({
    fields: (t) => ({
      liked: t.exposeBoolean('liked'),
      likeCount: t.exposeInt('likeCount'),
    }),
  });