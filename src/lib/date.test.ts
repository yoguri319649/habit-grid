import { toDateString, todayDateString } from './date';

describe('toDateString', () => {
  it('1桁の月・日はゼロ埋めされる', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('2桁の月・日はそのまま出力される', () => {
    expect(toDateString(new Date(2026, 10, 25))).toBe('2026-11-25');
  });
});

describe('todayDateString', () => {
  it('現在時刻をtoDateStringと同じ形式で返す', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 7, 9, 15, 0, 0));
    expect(todayDateString()).toBe('2026-08-09');
    jest.useRealTimers();
  });
});
