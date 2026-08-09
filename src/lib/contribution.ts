import { toDateString } from '@/lib/date';

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export type ContributionCell = {
  date: string;
  minutes: number;
  level: ContributionLevel;
};

/** Buckets daily minutes into 5 intensity levels for heatmap shading. */
export function levelForMinutes(minutes: number): ContributionLevel {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

/**
 * Builds a GitHub-style contribution grid: `weeks` full Sun-Sat columns ending on
 * the Saturday of the current week, with each day's total self-reported minutes.
 */
export function buildContributionGrid(
  timeLogs: { date: string; minutes: number }[],
  weeks: number,
  today: Date = new Date(),
): ContributionCell[][] {
  const minutesByDate = new Map(timeLogs.map((log) => [log.date, log.minutes]));

  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));

  const totalDays = weeks * 7;
  const days: ContributionCell[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date(endOfWeek);
    date.setDate(endOfWeek.getDate() - i);
    const dateString = toDateString(date);
    const minutes = minutesByDate.get(dateString) ?? 0;
    days.push({ date: dateString, minutes, level: levelForMinutes(minutes) });
  }

  const weeksGrid: ContributionCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    weeksGrid.push(days.slice(w * 7, w * 7 + 7));
  }
  return weeksGrid;
}
