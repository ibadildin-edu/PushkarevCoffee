import { APP_TIME_ZONE, parseIsoDate } from './dates';

const LOCALE = 'ru-RU';
const NBSP = ' ';

const numberFormat = new Intl.NumberFormat(LOCALE);
const compactFormat = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const percentFormat = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: APP_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

/** 2070 → «2 070» */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** 1395 → «1 395 ₸» */
export function formatMoney(value: number): string {
  return `${numberFormat.format(value)}${NBSP}₸`;
}

/** 2 900 000 → «2,9 млн ₸», 291 000 → «291 тыс ₸»; small sums stay exact. */
export function formatMoneyCompact(value: number): string {
  if (Math.abs(value) < 10_000) return formatMoney(value);
  return `${compactFormat.format(value).replace(/\.$/, '')}${NBSP}₸`;
}

/** 2 → «2,0 %». Takes a value in percent, not a fraction. */
export function formatPercent(value: number): string {
  return percentFormat.format(value / 100);
}

function dayMonth(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    day: 'numeric',
    month: 'short',
  }).formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const month = (parts.find((part) => part.type === 'month')?.value ?? '').replace('.', '');
  return `${day} ${month}`;
}

/** '2026-10-12' → «12 окт» */
export function formatDayMonth(isoDate: string): string {
  return dayMonth(parseIsoDate(isoDate), 'UTC');
}

/** '2026-10-18' → «18 окт 2026» */
export function formatDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return `${dayMonth(date, 'UTC')} ${date.getUTCFullYear()}`;
}

/** UTC timestamp → «16:36» in Asia/Almaty */
export function formatTime(isoDateTime: string): string {
  return timeFormat.format(new Date(isoDateTime));
}

/** UTC timestamp → «18 окт, 16:36» in Asia/Almaty */
export function formatDateTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return `${dayMonth(date, APP_TIME_ZONE)}, ${timeFormat.format(date)}`;
}

/** 3 → «3 позиции» */
export function pluralize(count: number, forms: readonly [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
