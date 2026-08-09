import { calculateWeightedProgress } from '@/lib/progress';

import { useSubTasks } from './use-subtasks';
import { useTask } from './use-tasks';

/**
 * A task's overall progress (0-100), kept live via useTask/useSubTasks.
 * Tasks without subtasks have no weighted average to compute, so progress falls back
 * to the task's own completed flag (100% once marked complete, 0% otherwise).
 */
export function useOverallProgress(taskId: number) {
  const task = useTask(taskId);
  const subTasks = useSubTasks(taskId);

  const weighted = calculateWeightedProgress(subTasks);
  if (weighted !== null) return weighted;

  return task?.completed ? 100 : 0;
}
