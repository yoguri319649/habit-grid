jest.mock('@/db/client', () => {
  const { createTestDb } = require('../test-utils/create-test-db');
  return { db: createTestDb() };
});

import { db } from '@/db/client';
import { subTasks, tasks } from '@/db/schema';

import * as subTaskRepository from './subtasks';
import { distributeProportionally, sumWeights } from './subtasks';
import * as taskRepository from './tasks';

describe('distributeProportionally', () => {
  it('重み比率に応じてtotalを配分する', () => {
    expect(distributeProportionally(50, [33, 33])).toEqual([25, 25]);
  });

  it('重みが全て0の場合は均等配分する', () => {
    const shares = distributeProportionally(70, [0, 0, 0]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(70);
    expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
  });

  it('配分結果の合計は常にtotalと一致する(最大剰余法)', () => {
    const shares = distributeProportionally(100, [1, 1, 1, 1, 1, 1, 1]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('要素が1つの場合は全量を割り当てる', () => {
    expect(distributeProportionally(100, [40])).toEqual([100]);
  });

  it('空配列を渡すと空配列を返す', () => {
    expect(distributeProportionally(100, [])).toEqual([]);
  });
});

describe('sumWeights', () => {
  it('重みの合計を返す', () => {
    expect(sumWeights([{ weight: 10 }, { weight: 20 }])).toBe(30);
  });

  it('空配列の場合は0を返す', () => {
    expect(sumWeights([])).toBe(0);
  });
});

describe('subTaskRepository', () => {
  beforeEach(async () => {
    await db.delete(subTasks);
    await db.delete(tasks);
  });

  async function createTask() {
    return taskRepository.createTask('テストタスク');
  }

  it('createSubTaskは重み0で作成後、自動で均等リバランスされる', async () => {
    const task = await createTask();

    await subTaskRepository.createSubTask(task.id, 'A');
    await subTaskRepository.createSubTask(task.id, 'B');
    await subTaskRepository.createSubTask(task.id, 'C');

    const list = await subTaskRepository.listSubTasks(task.id);
    expect(subTaskRepository.sumWeights(list)).toBe(100);
    expect(list.map((s) => s.weight)).toEqual([33, 33, 34]);
  });

  it('updateSubTaskNameは名称を更新する', async () => {
    const task = await createTask();
    const subTask = await subTaskRepository.createSubTask(task.id, '元の名前');

    await subTaskRepository.updateSubTaskName(subTask.id, '新しい名前');

    const [updated] = await subTaskRepository.listSubTasks(task.id);
    expect(updated.name).toBe('新しい名前');
  });

  it('updateSubTaskWeightは0〜100にクランプする', async () => {
    const task = await createTask();
    const subTask = await subTaskRepository.createSubTask(task.id, 'A');

    await subTaskRepository.updateSubTaskWeight(subTask.id, 150);
    expect((await subTaskRepository.listSubTasks(task.id))[0].weight).toBe(100);

    await subTaskRepository.updateSubTaskWeight(subTask.id, -10);
    expect((await subTaskRepository.listSubTasks(task.id))[0].weight).toBe(0);
  });

  it('updateSubTaskWeightは兄弟の重みを変更しない(手動編集は他に影響しない)', async () => {
    const task = await createTask();
    const a = await subTaskRepository.createSubTask(task.id, 'A');
    const b = await subTaskRepository.createSubTask(task.id, 'B');
    const c = await subTaskRepository.createSubTask(task.id, 'C');
    const before = await subTaskRepository.listSubTasks(task.id);
    const bWeightBefore = before.find((s) => s.id === b.id)?.weight;
    const cWeightBefore = before.find((s) => s.id === c.id)?.weight;

    await subTaskRepository.updateSubTaskWeight(a.id, 50);

    const after = await subTaskRepository.listSubTasks(task.id);
    expect(after.find((s) => s.id === a.id)?.weight).toBe(50);
    expect(after.find((s) => s.id === b.id)?.weight).toBe(bWeightBefore);
    expect(after.find((s) => s.id === c.id)?.weight).toBe(cWeightBefore);
    // 手動編集だけでは合計が100%からずれることがある(完了操作側で検証する)
    expect(subTaskRepository.sumWeights(after)).not.toBe(100);
  });

  it('サブタスクが1件のみでも、指定した重みがそのまま設定される(100に強制されない)', async () => {
    const task = await createTask();
    const subTask = await subTaskRepository.createSubTask(task.id, 'A');

    await subTaskRepository.updateSubTaskWeight(subTask.id, 10);

    expect((await subTaskRepository.listSubTasks(task.id))[0].weight).toBe(10);
  });

  it('updateSubTaskProgressは0〜100にクランプする', async () => {
    const task = await createTask();
    const subTask = await subTaskRepository.createSubTask(task.id, 'A');

    await subTaskRepository.updateSubTaskProgress(subTask.id, 150);
    expect((await subTaskRepository.listSubTasks(task.id))[0].progress).toBe(100);

    await subTaskRepository.updateSubTaskProgress(subTask.id, -10);
    expect((await subTaskRepository.listSubTasks(task.id))[0].progress).toBe(0);
  });

  it('deleteSubTaskは削除後、残りの重みを比率配分し合計100を維持する', async () => {
    const task = await createTask();
    const a = await subTaskRepository.createSubTask(task.id, 'A');
    const b = await subTaskRepository.createSubTask(task.id, 'B');
    await subTaskRepository.createSubTask(task.id, 'C');

    await subTaskRepository.deleteSubTask(a.id, task.id);

    const remaining = await subTaskRepository.listSubTasks(task.id);
    expect(remaining).toHaveLength(2);
    expect(subTaskRepository.sumWeights(remaining)).toBe(100);
    expect(remaining.find((s) => s.id === b.id)).toBeDefined();
  });

  it('deleteSubTaskは削除後にsortOrderを詰め直す', async () => {
    const task = await createTask();
    const a = await subTaskRepository.createSubTask(task.id, 'A');
    await subTaskRepository.createSubTask(task.id, 'B');
    const c = await subTaskRepository.createSubTask(task.id, 'C');

    await subTaskRepository.deleteSubTask(a.id, task.id);

    const remaining = await subTaskRepository.listSubTasks(task.id);
    expect(remaining.map((s) => s.sortOrder)).toEqual([0, 1]);
    expect(remaining.map((s) => s.id)).toEqual(expect.arrayContaining([c.id]));
  });

  it('reorderSubTasksは指定した順序でsortOrderを更新する', async () => {
    const task = await createTask();
    const a = await subTaskRepository.createSubTask(task.id, 'A');
    const b = await subTaskRepository.createSubTask(task.id, 'B');
    const c = await subTaskRepository.createSubTask(task.id, 'C');

    await subTaskRepository.reorderSubTasks(task.id, [c.id, a.id, b.id]);

    const list = await subTaskRepository.listSubTasks(task.id);
    expect(list.map((s) => s.id)).toEqual([c.id, a.id, b.id]);
  });

  it('rebalanceWeightsEquallyは均等割りし端数を最後の要素に寄せる', async () => {
    const task = await createTask();
    await subTaskRepository.createSubTask(task.id, 'A');
    await subTaskRepository.createSubTask(task.id, 'B');
    await subTaskRepository.createSubTask(task.id, 'C');

    await subTaskRepository.rebalanceWeightsEqually(task.id);

    const list = await subTaskRepository.listSubTasks(task.id);
    expect(list.map((s) => s.weight)).toEqual([33, 33, 34]);
  });
});
