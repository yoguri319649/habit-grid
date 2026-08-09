import { renderHook } from '@testing-library/react-native';

jest.mock('./use-tasks', () => ({ useTask: jest.fn() }));
jest.mock('./use-subtasks', () => ({ useSubTasks: jest.fn() }));

import { useOverallProgress } from './use-overall-progress';
import { useSubTasks } from './use-subtasks';
import { useTask } from './use-tasks';

const mockUseTask = useTask as jest.Mock;
const mockUseSubTasks = useSubTasks as jest.Mock;

describe('useOverallProgress', () => {
  it('サブタスクがある場合は加重平均を返す', async () => {
    mockUseSubTasks.mockReturnValue([{ weight: 100, progress: 40 }]);
    mockUseTask.mockReturnValue({ completed: false });

    const { result } = await renderHook(() => useOverallProgress(1));

    expect(result.current).toBe(40);
  });

  it('サブタスクが0件かつ未完了の場合は0を返す', async () => {
    mockUseSubTasks.mockReturnValue([]);
    mockUseTask.mockReturnValue({ completed: false });

    const { result } = await renderHook(() => useOverallProgress(1));

    expect(result.current).toBe(0);
  });

  it('サブタスクが0件かつ完了済みの場合は100を返す', async () => {
    mockUseSubTasks.mockReturnValue([]);
    mockUseTask.mockReturnValue({ completed: true });

    const { result } = await renderHook(() => useOverallProgress(1));

    expect(result.current).toBe(100);
  });
});
