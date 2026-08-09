import { calculateWeightedProgress } from './progress';

describe('calculateWeightedProgress', () => {
  it('サブタスクが0件の場合はnullを返す', () => {
    expect(calculateWeightedProgress([])).toBeNull();
  });

  it('サブタスク1件(重み100)はその進捗をそのまま返す', () => {
    expect(calculateWeightedProgress([{ weight: 100, progress: 33 }])).toBe(33);
  });

  it('複数サブタスクの加重平均を計算する', () => {
    expect(
      calculateWeightedProgress([
        { weight: 70, progress: 50 },
        { weight: 30, progress: 100 },
      ]),
    ).toBe(65);
  });

  it('重みの合計が0の場合は0を返す(ゼロ除算ガード)', () => {
    expect(calculateWeightedProgress([{ weight: 0, progress: 100 }])).toBe(0);
  });

  it('加重平均の端数は四捨五入される', () => {
    expect(
      calculateWeightedProgress([
        { weight: 1, progress: 0 },
        { weight: 2, progress: 100 },
      ]),
    ).toBe(Math.round(200 / 3));
  });
});
