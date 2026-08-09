import { render } from '@testing-library/react-native';

import { ProgressBar } from './progress-bar';

describe('ProgressBar', () => {
  it('0〜100の範囲内の値はそのまま幅に反映される', async () => {
    const { getByTestId } = await render(<ProgressBar progress={43} />);

    expect(getByTestId('progress-bar-fill').props.style.width).toBe('43%');
  });

  it('100を超える値は100にクランプされる', async () => {
    const { getByTestId } = await render(<ProgressBar progress={150} />);

    expect(getByTestId('progress-bar-fill').props.style.width).toBe('100%');
  });

  it('負の値は0にクランプされる', async () => {
    const { getByTestId } = await render(<ProgressBar progress={-10} />);

    expect(getByTestId('progress-bar-fill').props.style.width).toBe('0%');
  });
});
