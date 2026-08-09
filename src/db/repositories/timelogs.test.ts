jest.mock('@/db/client', () => {
  const { createTestDb } = require('../test-utils/create-test-db');
  return { db: createTestDb() };
});

import { db } from '@/db/client';
import { tasks, timeLogs } from '@/db/schema';

import * as taskRepository from './tasks';
import * as timeLogRepository from './timelogs';

describe('timeLogRepository', () => {
  beforeEach(async () => {
    await db.delete(timeLogs);
    await db.delete(tasks);
  });

  it('setTimeLogは該当日のレコードがなければ新規作成する', async () => {
    const task = await taskRepository.createTask('引っ越し');

    await timeLogRepository.setTimeLog(task.id, '2026-08-09', 30);

    const list = await timeLogRepository.listTimeLogs(task.id);
    expect(list).toHaveLength(1);
    expect(list[0].minutes).toBe(30);
  });

  it('setTimeLogは同日に複数回呼ぶと最後に指定した分数で上書きする', async () => {
    const task = await taskRepository.createTask('引っ越し');

    await timeLogRepository.setTimeLog(task.id, '2026-08-09', 60);
    await timeLogRepository.setTimeLog(task.id, '2026-08-09', 15);

    const list = await timeLogRepository.listTimeLogs(task.id);
    expect(list).toHaveLength(1);
    expect(list[0].minutes).toBe(15);
  });

  it('deleteTimeLogは対象レコードを削除する', async () => {
    const task = await taskRepository.createTask('引っ越し');
    const log = await timeLogRepository.setTimeLog(task.id, '2026-08-09', 30);

    await timeLogRepository.deleteTimeLog(log!.id);

    expect(await timeLogRepository.listTimeLogs(task.id)).toHaveLength(0);
  });

  it('listTimeLogsは日付の昇順で返す', async () => {
    const task = await taskRepository.createTask('引っ越し');

    await timeLogRepository.setTimeLog(task.id, '2026-08-09', 15);
    await timeLogRepository.setTimeLog(task.id, '2026-08-01', 30);
    await timeLogRepository.setTimeLog(task.id, '2026-08-05', 60);

    const list = await timeLogRepository.listTimeLogs(task.id);
    expect(list.map((l) => l.date)).toEqual(['2026-08-01', '2026-08-05', '2026-08-09']);
  });
});
