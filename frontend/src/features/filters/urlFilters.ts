import { parseEnum, parsePositiveInt, withParams } from '../../shared/lib/searchParams';
import { initialFiltersState, PERIODS, type FiltersState } from './filtersSlice';

const KEYS = { period: 'period', location: 'location', live: 'live' } as const;

const PERIOD_VALUES = PERIODS.map(String);

export function hasFilterParams(params: URLSearchParams): boolean {
  return Object.values(KEYS).some((key) => params.has(key));
}

export function parseFilters(params: URLSearchParams): FiltersState {
  const period = parseEnum(params.get(KEYS.period), PERIOD_VALUES);
  return {
    period: period ? (Number(period) as FiltersState['period']) : initialFiltersState.period,
    locationId: parsePositiveInt(params.get(KEYS.location)) ?? null,
    live: params.get(KEYS.live) === '1',
  };
}

export function writeFilters(params: URLSearchParams, filters: FiltersState): URLSearchParams {
  return withParams(params, {
    [KEYS.period]: filters.period,
    [KEYS.location]: filters.locationId,
    [KEYS.live]: filters.live ? 1 : undefined,
  });
}

export function sameFilters(a: FiltersState, b: FiltersState): boolean {
  return a.period === b.period && a.locationId === b.locationId && a.live === b.live;
}
