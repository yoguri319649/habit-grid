import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('@/db/repositories', () => ({
  timeLogRepository: { setTimeLog: jest.fn() },
}));
jest.mock('@/lib/date', () => ({ todayDateString: () => '2026-08-09' }));

import { timeLogRepository } from '@/db/repositories';

import { TimeChipRow } from './time-chip-row';

const mockSetTimeLog = timeLogRepository.setTimeLog as jest.Mock;

describe('TimeChipRow', () => {
  beforeEach(() => {
    mockSetTimeLog.mockClear();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('「15分」タップでsetTimeLog(taskId, today, 15)を呼ぶ', async () => {
    const { findByText } = await render(<TimeChipRow taskId={1} />);

    fireEvent.press(await findByText('15分'));

    expect(mockSetTimeLog).toHaveBeenCalledWith(1, '2026-08-09', 15);
  });

  it('「30分」「1時間」も同様に正しい分数で呼ばれる', async () => {
    const { findByText } = await render(<TimeChipRow taskId={1} />);

    fireEvent.press(await findByText('30分'));
    expect(mockSetTimeLog).toHaveBeenCalledWith(1, '2026-08-09', 30);

    fireEvent.press(await findByText('1時間'));
    expect(mockSetTimeLog).toHaveBeenCalledWith(1, '2026-08-09', 60);
  });

  it('大きいチップの後に小さいチップを押すと小さい方の値で上書きされる', async () => {
    const { findByText } = await render(<TimeChipRow taskId={1} />);

    fireEvent.press(await findByText('1時間'));
    expect(mockSetTimeLog).toHaveBeenLastCalledWith(1, '2026-08-09', 60);

    fireEvent.press(await findByText('15分'));
    expect(mockSetTimeLog).toHaveBeenLastCalledWith(1, '2026-08-09', 15);
  });

  it('「それ以上」タップでAlert.promptが呼ばれる', async () => {
    const { findByTestId } = await render(<TimeChipRow taskId={1} />);
    const promptSpy = jest.spyOn(Alert, 'prompt').mockImplementation(() => {});

    fireEvent.press(await findByTestId('time-chip-more'));

    expect(promptSpy).toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it('Alert.promptで正の数値を入力するとsetTimeLogが呼ばれる', async () => {
    const { findByTestId } = await render(<TimeChipRow taskId={1} />);
    const promptSpy = jest
      .spyOn(Alert, 'prompt')
      .mockImplementation((_title, _message, callbackOrButtons) => {
        if (typeof callbackOrButtons === 'function') callbackOrButtons('90');
      });

    fireEvent.press(await findByTestId('time-chip-more'));

    expect(mockSetTimeLog).toHaveBeenCalledWith(1, '2026-08-09', 90);
    promptSpy.mockRestore();
  });

  it('Alert.promptで数値以外・0以下を入力すると何もしない', async () => {
    const { findByTestId } = await render(<TimeChipRow taskId={1} />);
    const promptSpy = jest
      .spyOn(Alert, 'prompt')
      .mockImplementation((_title, _message, callbackOrButtons) => {
        if (typeof callbackOrButtons === 'function') callbackOrButtons('0');
      });

    fireEvent.press(await findByTestId('time-chip-more'));

    expect(mockSetTimeLog).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });
});
