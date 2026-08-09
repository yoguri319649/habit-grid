import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('@/db/repositories', () => ({
  timeLogRepository: { addTimeLog: jest.fn() },
}));
jest.mock('@/lib/date', () => ({ todayDateString: () => '2026-08-09' }));

import { timeLogRepository } from '@/db/repositories';

import { TimeChipRow } from './time-chip-row';

const mockAddTimeLog = timeLogRepository.addTimeLog as jest.Mock;

describe('TimeChipRow', () => {
  beforeEach(() => {
    mockAddTimeLog.mockClear();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('「15分」タップでaddTimeLog(taskId, today, 15)を呼ぶ', async () => {
    const { findByText } = await render(<TimeChipRow taskId={1} />);

    fireEvent.press(await findByText('15分'));

    expect(mockAddTimeLog).toHaveBeenCalledWith(1, '2026-08-09', 15);
  });

  it('「30分」「1時間」も同様に正しい分数で呼ばれる', async () => {
    const { findByText } = await render(<TimeChipRow taskId={1} />);

    fireEvent.press(await findByText('30分'));
    expect(mockAddTimeLog).toHaveBeenCalledWith(1, '2026-08-09', 30);

    fireEvent.press(await findByText('1時間'));
    expect(mockAddTimeLog).toHaveBeenCalledWith(1, '2026-08-09', 60);
  });

  it('「それ以上」タップでAlert.promptが呼ばれる', async () => {
    const { findByTestId } = await render(<TimeChipRow taskId={1} />);
    const promptSpy = jest.spyOn(Alert, 'prompt').mockImplementation(() => {});

    fireEvent.press(await findByTestId('time-chip-more'));

    expect(promptSpy).toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it('Alert.promptで正の数値を入力するとaddTimeLogが呼ばれる', async () => {
    const { findByTestId } = await render(<TimeChipRow taskId={1} />);
    const promptSpy = jest
      .spyOn(Alert, 'prompt')
      .mockImplementation((_title, _message, callbackOrButtons) => {
        if (typeof callbackOrButtons === 'function') callbackOrButtons('90');
      });

    fireEvent.press(await findByTestId('time-chip-more'));

    expect(mockAddTimeLog).toHaveBeenCalledWith(1, '2026-08-09', 90);
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

    expect(mockAddTimeLog).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });
});
