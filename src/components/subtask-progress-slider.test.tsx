import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/db/repositories', () => ({
  subTaskRepository: { updateSubTaskProgress: jest.fn() },
}));

import { subTaskRepository } from '@/db/repositories';

import { SubTaskProgressSlider } from './subtask-progress-slider';

const mockUpdateSubTaskProgress = subTaskRepository.updateSubTaskProgress as jest.Mock;

describe('SubTaskProgressSlider', () => {
  beforeEach(() => {
    mockUpdateSubTaskProgress.mockClear();
  });

  it('初期表示でprogress propの値を表示する', async () => {
    await render(<SubTaskProgressSlider subTaskId={1} progress={40} />);

    expect(screen.getByText('40%')).toBeTruthy();
  });

  it('スライド完了時にupdateSubTaskProgressを正しい引数で呼ぶ', async () => {
    await render(<SubTaskProgressSlider subTaskId={1} progress={40} />);

    fireEvent(screen.getByTestId('subtask-progress-slider'), 'slidingComplete', 70);

    expect(mockUpdateSubTaskProgress).toHaveBeenCalledWith(1, 70);
  });
});
