import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: int('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  createdAt: int('created_at', { mode: 'timestamp_ms' }).notNull(),
  completed: int('completed', { mode: 'boolean' }).notNull().default(false),
});

export const subTasks = sqliteTable('sub_tasks', {
  id: int('id').primaryKey({ autoIncrement: true }),
  taskId: int('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  weight: int('weight').notNull(),
  progress: int('progress').notNull().default(0),
  sortOrder: int('sort_order').notNull().default(0),
});

export const timeLogs = sqliteTable('time_logs', {
  id: int('id').primaryKey({ autoIncrement: true }),
  taskId: int('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  minutes: int('minutes').notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type SubTask = typeof subTasks.$inferSelect;
export type NewSubTask = typeof subTasks.$inferInsert;
export type TimeLog = typeof timeLogs.$inferSelect;
export type NewTimeLog = typeof timeLogs.$inferInsert;
