/** Weighted-average progress across a task's subtasks (weights are assumed to sum to ~100). Returns null if there are no subtasks. */
export function calculateWeightedProgress(
  subTasks: { weight: number; progress: number }[],
): number | null {
  if (subTasks.length === 0) return null;

  const totalWeight = subTasks.reduce((sum, subTask) => sum + subTask.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = subTasks.reduce(
    (sum, subTask) => sum + subTask.weight * subTask.progress,
    0,
  );
  return Math.round(weightedSum / totalWeight);
}
