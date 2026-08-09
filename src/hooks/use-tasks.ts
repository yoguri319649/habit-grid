import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { taskRepository } from '@/db/repositories';

/** Live-updating list of all tasks, newest first. Re-renders automatically after any write to the tasks table. */
export function useTasks() {
  const { data } = useLiveQuery(taskRepository.tasksQuery());
  return data;
}

/** Live-updating single task by id, or undefined while loading / if it doesn't exist. */
export function useTask(taskId: number) {
  const { data } = useLiveQuery(taskRepository.taskQuery(taskId), [taskId]);
  return data?.[0];
}
