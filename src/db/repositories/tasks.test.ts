jest.mock('@/db/client', () => {
  const { createTestDb } = require('../test-utils/create-test-db');
  return { db: createTestDb() };
});

import { db } from '@/db/client';
import { subTasks, tasks, timeLogs } from '@/db/schema';

import * as subTaskRepository from './subtasks';
import * as taskRepository from './tasks';
import * as timeLogRepository from './timelogs';

beforeEach(async () => {
  await db.delete(timeLogs);
  await db.delete(subTasks);
  await db.delete(tasks);
});

describe('taskRepository', () => {
  it('createTaskはタイトル・作成日時・completed=falseで登録する', async () => {
    const task = await taskRepository.createTask('引っ越し');

    expect(task.title).toBe('引っ越し');
    expect(task.completed).toBe(false);
    expect(task.createdAt).toBeInstanceOf(Date);
  });

  it('renameTaskはタイトルを更新する', async () => {
    const task = await taskRepository.createTask('元のタイトル');

    await taskRepository.renameTask(task.id, '新タイトル');

    expect((await taskRepository.getTask(task.id))?.title).toBe('新タイトル');
  });

  it('setTaskCompletedは完了状態を設定する', async () => {
    const task = await taskRepository.createTask('タスク');

    await taskRepository.setTaskCompleted(task.id, true);

    expect((await taskRepository.getTask(task.id))?.completed).toBe(true);
  });

  it('deleteTaskは対象タスクを削除する', async () => {
    const task = await taskRepository.createTask('削除対象');

    await taskRepository.deleteTask(task.id);

    expect(await taskRepository.getTask(task.id)).toBeUndefined();
  });

  it('deleteTaskは紐づくサブタスク・時間記録もカスケード削除する', async () => {
    const task = await taskRepository.createTask('引っ越し');
    await subTaskRepository.createSubTask(task.id, '荷造り');
    await timeLogRepository.addTimeLog(task.id, '2026-08-09', 30);

    await taskRepository.deleteTask(task.id);

    expect(await subTaskRepository.listSubTasks(task.id)).toHaveLength(0);
    expect(await timeLogRepository.listTimeLogs(task.id)).toHaveLength(0);
  });

  it('listTasksは作成日時の降順で返す', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 1));
    const first = await taskRepository.createTask('1番目に作成');
    jest.setSystemTime(new Date(2026, 0, 2));
    const second = await taskRepository.createTask('2番目に作成');
    jest.setSystemTime(new Date(2026, 0, 3));
    const third = await taskRepository.createTask('3番目に作成');
    jest.useRealTimers();

    const list = await taskRepository.listTasks();

    expect(list.map((task) => task.id)).toEqual([third.id, second.id, first.id]);
  });

  it('getTaskは存在しないIDに対してundefinedを返す', async () => {
    expect(await taskRepository.getTask(9999)).toBeUndefined();
  });
});
