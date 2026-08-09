import { desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { tasks } from '@/db/schema';

/** Query builder (not yet awaited) so callers can subscribe to it via useLiveQuery. */
export function tasksQuery() {
  return db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export function taskQuery(taskId: number) {
  return db.select().from(tasks).where(eq(tasks.id, taskId));
}

export async function listTasks() {
  return tasksQuery();
}

export async function getTask(taskId: number) {
  const [task] = await taskQuery(taskId);
  return task;
}

export async function createTask(title: string) {
  const [task] = await db
    .insert(tasks)
    .values({ title, createdAt: new Date() })
    .returning();
  return task;
}

export async function renameTask(taskId: number, title: string) {
  const [task] = await db
    .update(tasks)
    .set({ title })
    .where(eq(tasks.id, taskId))
    .returning();
  return task;
}

export async function setTaskCompleted(taskId: number, completed: boolean) {
  const [task] = await db
    .update(tasks)
    .set({ completed })
    .where(eq(tasks.id, taskId))
    .returning();
  return task;
}

export async function deleteTask(taskId: number) {
  await db.delete(tasks).where(eq(tasks.id, taskId));
}
