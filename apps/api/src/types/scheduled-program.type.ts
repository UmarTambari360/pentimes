import { z } from 'zod';
import type { ScheduledProgramSelect } from '../db/schema/index.js';

export type ScheduledProgram = ScheduledProgramSelect;

export const CreateScheduledProgramSchema = z.object({
  title: z
    .string()
    .min(3, 'Program title must be at least 3 characters')
    .max(200, 'Program title cannot exceed 200 characters')
    .trim(),

  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),

  scheduledAt: z
    .string()
    .datetime('Scheduled date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val)),

  durationMinutes: z
    .number()
    .int('Duration must be a whole number of minutes')
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 24 hours')
    .optional(),

  status: z.enum(['upcoming', 'completed', 'cancelled']).default('upcoming'),
});

export type CreateScheduledProgramInput = z.infer<typeof CreateScheduledProgramSchema>;

export const UpdateScheduledProgramSchema = z.object({
  title: z
    .string()
    .min(3, 'Program title must be at least 3 characters')
    .max(200, 'Program title cannot exceed 200 characters')
    .trim()
    .optional(),

  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),

  scheduledAt: z
    .string()
    .datetime('Scheduled date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val))
    .optional(),

  durationMinutes: z
    .number()
    .int('Duration must be a whole number of minutes')
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 24 hours')
    .nullable()
    .optional(),

  status: z.enum(['upcoming', 'completed', 'cancelled']).optional(),
});

export type UpdateScheduledProgramInput = z.infer<typeof UpdateScheduledProgramSchema>;