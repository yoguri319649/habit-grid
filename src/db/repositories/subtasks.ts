import { asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { subTasks } from '@/db/schema';

/** Query builder (not yet awaited) so callers can subscribe to it via useLiveQuery. */
export function subTasksQuery(taskId: number) {
  return db
    .select()
    .from(subTasks)
    .where(eq(subTasks.taskId, taskId))
    .orderBy(asc(subTasks.sortOrder));
}

export async function listSubTasks(taskId: number) {
  return subTasksQuery(taskId);
}

export async function createSubTask(taskId: number, name: string) {
  const existing = await listSubTasks(taskId);

  const [subTask] = await db
    .insert(subTasks)
    .values({ taskId, name, weight: 0, sortOrder: existing.length })
    .returning();

  await rebalanceWeightsEqually(taskId);
  return subTask;
}

export async function updateSubTaskName(subTaskId: number, name: string) {
  const [subTask] = await db
    .update(subTasks)
    .set({ name })
    .where(eq(subTasks.id, subTaskId))
    .returning();
  return subTask;
}

/**
 * Sets a subtask's weight (0-100) without touching its siblings. Manual edits are intentionally
 * isolated to the subtask being edited; whether the task's weights sum to 100% is checked
 * separately (e.g. before letting the user finish editing a task), not auto-corrected here.
 */
export async function updateSubTaskWeight(subTaskId: number, weight: number) {
  const clamped = Math.min(100, Math.max(0, Math.round(weight)));
  const [subTask] = await db
    .update(subTasks)
    .set({ weight: clamped })
    .where(eq(subTasks.id, subTaskId))
    .returning();
  return subTask;
}

export async function updateSubTaskProgress(subTaskId: number, progress: number) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  const [subTask] = await db
    .update(subTasks)
    .set({ progress: clamped })
    .where(eq(subTasks.id, subTaskId))
    .returning();
  return subTask;
}

/** Deletes a subtask and redistributes its weight among the remaining siblings, keeping their total at 100%. */
export async function deleteSubTask(subTaskId: number, taskId: number) {
  await db.delete(subTasks).where(eq(subTasks.id, subTaskId));
  await reindexSortOrder(taskId);

  const remaining = await listSubTasks(taskId);
  if (remaining.length === 0) return;

  const shares = distributeProportionally(
    100,
    remaining.map((subTask) => subTask.weight),
  );
  await Promise.all(
    remaining.map((subTask, index) =>
      db.update(subTasks).set({ weight: shares[index] }).where(eq(subTasks.id, subTask.id)),
    ),
  );
}

export async function reorderSubTasks(taskId: number, orderedSubTaskIds: number[]) {
  await Promise.all(
    orderedSubTaskIds.map((subTaskId, index) =>
      db.update(subTasks).set({ sortOrder: index }).where(eq(subTasks.id, subTaskId)),
    ),
  );
}

/** Splits 100% evenly across all of a task's subtasks; the remainder goes to the last one so the total is always exactly 100. */
export async function rebalanceWeightsEqually(taskId: number) {
  const existing = await listSubTasks(taskId);
  if (existing.length === 0) return;

  const base = Math.floor(100 / existing.length);
  const remainder = 100 - base * existing.length;

  await Promise.all(
    existing.map((subTask, index) =>
      db
        .update(subTasks)
        .set({ weight: base + (index === existing.length - 1 ? remainder : 0) })
        .where(eq(subTasks.id, subTask.id)),
    ),
  );
}

export function sumWeights(subTasksList: { weight: number }[]) {
  return subTasksList.reduce((total, subTask) => total + subTask.weight, 0);
}

async function reindexSortOrder(taskId: number) {
  const remaining = await listSubTasks(taskId);
  await Promise.all(
    remaining.map((subTask, index) =>
      db.update(subTasks).set({ sortOrder: index }).where(eq(subTasks.id, subTask.id)),
    ),
  );
}

/**
 * Splits `total` across `weights` proportionally to their current values (equally if they're all 0),
 * using the largest-remainder method so the integer shares always sum to exactly `total`.
 */
export function distributeProportionally(total: number, weights: number[]): number[] {
  if (weights.length === 0) return [];

  const sum = weights.reduce((a, b) => a + b, 0);
  const raw =
    sum === 0 ? weights.map(() => total / weights.length) : weights.map((w) => (w / sum) * total);

  const shares = raw.map(Math.floor);
  let remainder = total - shares.reduce((a, b) => a + b, 0);

  const byFractionDesc = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < remainder; i++) {
    shares[byFractionDesc[i % byFractionDesc.length].index] += 1;
  }

  return shares;
}
