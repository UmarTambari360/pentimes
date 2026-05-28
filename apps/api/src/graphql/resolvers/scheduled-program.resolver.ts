import { builder } from '../builder.js';
import {
  findAllPrograms,
  findProgramById,
  findUpcomingPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} from '../../queries/scheduled-program.queries.js';
import { cacheService, CacheKeys } from '../../services/redis.service.js';
import { CACHE_TTL } from '@pentimes/shared';
import { CreateProgramInput, UpdateProgramInput } from '../inputs.js';
import '../typedefs/scheduled-program.typedef.js';
import { ScheduledProgramType } from '../typedefs/scheduled-program.typedef.js';
import { GraphQLError } from 'graphql';

builder.queryField('scheduledPrograms', (t) =>
  t.field({
    type: [ScheduledProgramType],
    args: { status: t.arg.string({ required: false }) },
    resolve: async (_parent, { status }) => {
      const validStatus = status as 'upcoming' | 'completed' | 'cancelled' | undefined;
      const cacheKey = CacheKeys.programs(validStatus);
      const cached = await cacheService.get<Awaited<ReturnType<typeof findAllPrograms>>>(cacheKey);
      if (cached) return cached;

      const result = await findAllPrograms(validStatus);
      await cacheService.set(cacheKey, result, CACHE_TTL.PROGRAMS);
      return result;
    },
  })
);

builder.queryField('upcomingPrograms', (t) =>
  t.field({
    type: [ScheduledProgramType],
    args: { limit: t.arg.int({ required: false, defaultValue: 5 }) },
    resolve: async (_parent, { limit }) => {
      return findUpcomingPrograms(limit ?? 5);
    },
  })
);

builder.queryField('scheduledProgram', (t) =>
  t.field({
    type: ScheduledProgramType,
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_parent, { id }) => findProgramById(id),
  })
);

builder.mutationField('createScheduledProgram', (t) =>
  t.field({
    type: ScheduledProgramType,
    authScopes: { role: 'admin' },
    args: { input: t.arg({ type: CreateProgramInput, required: true }) },
    resolve: async (_parent, { input }) => {
      const program = await createProgram({
        title: input.title,
        description: input.description ?? null,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: input.durationMinutes ?? null,
        status: (input.status as 'upcoming' | 'completed' | 'cancelled') ?? 'upcoming',
      });
      await cacheService.delPattern('programs:*');
      return program;
    },
  })
);

builder.mutationField('updateScheduledProgram', (t) =>
  t.field({
    type: ScheduledProgramType,
    authScopes: { role: 'admin' },
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateProgramInput, required: true }),
    },
    resolve: async (_parent, { id, input }) => {
      const updates: Parameters<typeof updateProgram>[1] = {};
      if (input.title) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description ?? null;
      if (input.scheduledAt) updates.scheduledAt = new Date(input.scheduledAt);
      if (input.durationMinutes !== undefined) updates.durationMinutes = input.durationMinutes ?? null;
      if (input.status) updates.status = input.status as 'upcoming' | 'completed' | 'cancelled';

      const program = await updateProgram(id, updates);
      if (!program) throw new GraphQLError('Program not found');
      await cacheService.delPattern('programs:*');
      return program;
    },
  })
);

builder.mutationField('deleteScheduledProgram', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { role: 'admin' },
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_parent, { id }) => {
      const existing = await findProgramById(id);
      if (!existing) throw new GraphQLError('Program not found');
      const deleted = await deleteProgram(id);
      if (deleted) await cacheService.delPattern('programs:*');
      return deleted;
    },
  })
);