import { periodRange } from '../../shared/lib/dates';
import type { AnalyticsArgs } from './api';

export const LIVE_POLLING_MS = 10_000;

/** RTK Query options: poll every ~10 s while Live is on, pause in background tabs. */
export function liveQueryOptions(live: boolean) {
  return { pollingInterval: live ? LIVE_POLLING_MS : 0, skipPollingIfUnfocused: true };
}

export function analyticsArgs(
  period: number,
  locationId: number | null | undefined,
): AnalyticsArgs {
  const { dateFrom, dateTo } = periodRange(period);
  return {
    date_from: dateFrom,
    date_to: dateTo,
    location_id: locationId ?? undefined,
  };
}
