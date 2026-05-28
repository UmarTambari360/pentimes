import {
  pgTable,
  uuid,
  varchar,
  text,
  pgEnum,
  timestamp,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['reader', 'author', 'admin']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: varchar('name', { length: 120 }).notNull(),

  email: varchar('email', { length: 255 }).notNull().unique(),

  password: varchar('password', { length: 255 }).notNull(),

  avatar: text('avatar'),

  role: userRoleEnum('role').notNull().default('reader'),

  bio: text('bio'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;