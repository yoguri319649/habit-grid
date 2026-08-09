import { fireEvent, render } from '@testing-library/react-native';
import { Alert, processColor } from 'react-native';

import { todayDateString } from '@/lib/date';

import { ContributionGraph } from './contribution-graph';

describe('ContributionGraph', () => {
  let colorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    colorSchemeSpy = jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('light');
  });

  afterEach(() => {
    colorSchemeSpy.mockRestore();
  });

  it('timeLogsから計算したlevelに対応する色でセルが描画される', async () => {
    const today = todayDateString();
    const { findByTestId } = await render(
      <ContributionGraph timeLogs={[{ date: today, minutes: 45 }]} />,
    );

    const cell = await findByTestId(`contribution-cell-${today}`);

    // 45分 -> level 2 -> ライトモードの level2 色 '#6da7ec'(contribution.tsのLEVEL_COLORSと対応)
    expect(cell.props.fill.payload).toBe(processColor('#6da7ec'));
  });

  it('ライトモードとダークモードで異なる配色を使う', async () => {
    const today = todayDateString();
    colorSchemeSpy.mockReturnValue('dark');

    const { findByTestId } = await render(
      <ContributionGraph timeLogs={[{ date: today, minutes: 45 }]} />,
    );
    const cell = await findByTestId(`contribution-cell-${today}`);

    // ダークモードのlevel2色 '#2a78d6' はライトモードの level2 色 '#6da7ec' と異なる
    expect(cell.props.fill.payload).toBe(processColor('#2a78d6'));
  });

  it('セルタップで日付と分数を表示する', async () => {
    const today = todayDateString();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { findByTestId } = await render(
      <ContributionGraph timeLogs={[{ date: today, minutes: 45 }]} />,
    );

    fireEvent.press(await findByTestId(`contribution-cell-${today}`));

    expect(alertSpy).toHaveBeenCalledWith(today, '45分取り組みました');
    alertSpy.mockRestore();
  });
});
