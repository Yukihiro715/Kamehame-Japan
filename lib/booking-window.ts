/** Last bookable day, measured in calendar months from today in Japan. */
export function lastAdvanceBookingDate(months: number, now = Date.now()) {
  const today = new Date(now + 9 * 3600000);
  const targetMonth = today.getUTCMonth() + months;
  const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(today.getUTCFullYear(), targetMonth, Math.min(today.getUTCDate(), monthEnd)))
    .toISOString().slice(0, 10);
}


export interface ScheduleSeason {
  from: string;
  to: string;
  startTimes: string[];
  closedWeekdays?: number[];
}

/** Select the alternate timetable for a month/day range, including year-end ranges. */
export function scheduleSeason(date: string, season?: ScheduleSeason) {
  if (!season) return undefined;
  const day = date.slice(5);
  const { from, to } = season;
  return (from <= to ? day >= from && day <= to : day >= from || day <= to) ? season : undefined;
}
