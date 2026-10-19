export const APP_TIME_ZONE = 'Asia/Almaty';

const isoDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Calendar date 'YYYY-MM-DD' as a Date at UTC midnight. */
export function parseIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

/** Today's date in Asia/Almaty as 'YYYY-MM-DD'. */
export function todayIso(now: Date = new Date()): string {
  return isoDateFormat.format(now);
}

export function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export interface DateRange {
  dateFrom: string;
  dateTo: string;
}

/** Last `days` days including today, Asia/Almaty. Matches the backend's inclusive range. */
export function periodRange(days: number, now: Date = new Date()): DateRange {
  const dateTo = todayIso(now);
  return { dateFrom: addDays(dateTo, -(days - 1)), dateTo };
}
