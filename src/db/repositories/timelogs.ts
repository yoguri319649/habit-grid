import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { timeLogs } from '@/db/schema';

/** Query builder (not yet awaited) so callers can subscribe to it via useLiveQuery. */
export function timeLogsQuery(taskId: number) {
  return db
    .select()
    .from(timeLogs)
    .where(eq(timeLogs.taskId, taskId))
    .orderBy(asc(timeLogs.date));
}

export async function listTimeLogs(taskId: number) {
  return timeLogsQuery(taskId);
}

/** Records self-reported minutes for a task on a given day, adding to any minutes already logged that day. */
export async function addTimeLog(taskId: number, date: string, minutes: number) {
  const [existing] = await db
    .select()
    .from(timeLogs)
    .where(and(eq(timeLogs.taskId, taskId), eq(timeLogs.date, date)));

  if (existing) {
    const [timeLog] = await db
      .update(timeLogs)
      .set({ minutes: existing.minutes + minutes })
      .where(eq(timeLogs.id, existing.id))
      .returning();
    return timeLog;
  }

  const [timeLog] = await db.insert(timeLogs).values({ taskId, date, minutes }).returning();
  return timeLog;
}

export async function deleteTimeLog(timeLogId: number) {
  await db.delete(timeLogs).where(eq(timeLogs.id, timeLogId));
}
