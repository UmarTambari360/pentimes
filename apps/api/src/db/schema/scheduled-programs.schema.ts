import {
  pgTable,
  uuid,
  varchar,
  text,
  pgEnum,
  timestamp,
  integer,
  index,
} from 'drizzle-orm/pg-core';

export const programStatusEnum = pgEnum('program_status', [
  'upcoming',
  'completed',
  'cancelled',
]);

export const scheduledPrograms = pgTable(
  'scheduled_programs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    title: varchar('title', { length: 200 }).notNull(),

    description: text('description'),

    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),

    durationMinutes: integer('duration_minutes'),

    status: programStatusEnum('status').notNull().default('upcoming'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    statusScheduledAtIdx: index('programs_status_scheduled_at_idx').on(
      table.status,
      table.scheduledAt
    ),
  })
);

export type ScheduledProgramSelect = typeof scheduledPrograms.$inferSelect;
export type ScheduledProgramInsert = typeof scheduledPrograms.$inferInsert;