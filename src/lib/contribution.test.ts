import { buildContributionGrid, levelForMinutes } from './contribution';

describe('levelForMinutes', () => {
  it('0分は level 0', () => {
    expect(levelForMinutes(0)).toBe(0);
  });

  it('29分は level 1(境界値)', () => {
    expect(levelForMinutes(29)).toBe(1);
  });

  it('30分は level 2(境界値)', () => {
    expect(levelForMinutes(30)).toBe(2);
  });

  it('59分は level 2(境界値)', () => {
    expect(levelForMinutes(59)).toBe(2);
  });

  it('60分は level 3(境界値)', () => {
    expect(levelForMinutes(60)).toBe(3);
  });

  it('119分は level 3(境界値)', () => {
    expect(levelForMinutes(119)).toBe(3);
  });

  it('120分は level 4(境界値)', () => {
    expect(levelForMinutes(120)).toBe(4);
  });

  it('120分を超えても level 4', () => {
    expect(levelForMinutes(500)).toBe(4);
  });
});

describe('buildContributionGrid', () => {
  const today = new Date(2026, 7, 5); // 2026-08-05 (水曜日)

  it('weeks × 7 のグリッドを生成する', () => {
    const grid = buildContributionGrid([], 12, today);
    expect(grid).toHaveLength(12);
    grid.forEach((week) => expect(week).toHaveLength(7));
  });

  it('各列の先頭セルは日曜日である', () => {
    const grid = buildContributionGrid([], 12, today);
    grid.forEach((week) => {
      expect(new Date(week[0].date).getDay()).toBe(0);
    });
  });

  it('最終セルは今週の土曜日である', () => {
    const grid = buildContributionGrid([], 12, today);
    const lastWeek = grid[grid.length - 1];
    const lastCell = lastWeek[lastWeek.length - 1];
    expect(new Date(lastCell.date).getDay()).toBe(6);
    expect(new Date(lastCell.date).getTime()).toBeGreaterThanOrEqual(today.getTime());
  });

  it('全セルの日付が1日間隔で連続している', () => {
    const grid = buildContributionGrid([], 12, today);
    const flat = grid.flat();
    for (let i = 1; i < flat.length; i++) {
      const prev = new Date(flat[i - 1].date);
      const cur = new Date(flat[i].date);
      const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
      expect(diffDays).toBe(1);
    }
  });

  it('該当日のminutesが正しく反映される', () => {
    const grid = buildContributionGrid([{ date: '2026-08-05', minutes: 45 }], 12, today);
    const cell = grid.flat().find((c) => c.date === '2026-08-05');
    expect(cell).toEqual({ date: '2026-08-05', minutes: 45, level: 2 });
  });

  it('記録がない日は0分・level0になる', () => {
    const grid = buildContributionGrid([{ date: '2026-08-05', minutes: 45 }], 12, today);
    const cell = grid.flat().find((c) => c.date === '2026-08-04');
    expect(cell).toEqual({ date: '2026-08-04', minutes: 0, level: 0 });
  });
});
