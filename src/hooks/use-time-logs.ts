import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { timeLogRepository } from '@/db/repositories';

/** Live-updating list of a task's time logs, ordered by date. Re-renders automatically after any write. */
export function useTimeLogs(taskId: number) {
  const { data } = useLiveQuery(timeLogRepository.timeLogsQuery(taskId), [taskId]);
  return data;
}
