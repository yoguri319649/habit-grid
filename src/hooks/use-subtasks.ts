import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { subTaskRepository } from '@/db/repositories';

/** Live-updating list of a task's subtasks, ordered by sortOrder. Re-renders automatically after any write. */
export function useSubTasks(taskId: number) {
  const { data } = useLiveQuery(subTaskRepository.subTasksQuery(taskId), [taskId]);
  return data;
}
