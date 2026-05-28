import { builder } from '../builder.js';
import type { ScheduledProgram } from '../../types/scheduled-program.type.ts';

export const ScheduledProgramType = builder.objectRef<ScheduledProgram>('ScheduledProgram').implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    title: t.exposeString('title'),
    description: t.exposeString('description', { nullable: true }),
    durationMinutes: t.exposeInt('durationMinutes', { nullable: true }),
    status: t.exposeString('status'),
    scheduledAt: t.field({
      type: 'String',
      resolve: (p) => (p.scheduledAt as Date).toISOString(),
    }),
    createdAt: t.field({
      type: 'String',
      resolve: (p) => (p.createdAt as Date).toISOString(),
    }),
  }),
});