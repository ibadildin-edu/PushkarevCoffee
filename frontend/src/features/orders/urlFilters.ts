import { ORDER_STATUSES, type OrderSort, type OrderStatus } from '../../api/types';
import { isIsoDate } from '../../shared/lib/dates';
import { parseEnum, parsePositiveInt, withParams } from '../../shared/lib/searchParams';

export const ORDER_SORTS: readonly OrderSort[] = [
  'created_at',
  '-created_at',
  'total_amount',
  '-total_amount',
  'number',
  '-number',
];
export const DEFAULT_SORT: OrderSort = '-created_at';

/** Table filters of the Orders page; they live in the URL search params. */
export interface OrdersFilterValues {
  dateFrom?: string;
  dateTo?: string;
  locationId?: number;
  status?: OrderStatus;
  productId?: number;
  minTotal?: number;
  maxTotal?: number;
}

function parseAmount(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value)) return undefined;
  return Number(value);
}

export function parseOrdersSearch(params: URLSearchParams) {
  const filters: OrdersFilterValues = {
    dateFrom: isIsoDate(params.get('date_from'))
      ? (params.get('date_from') ?? undefined)
      : undefined,
    dateTo: isIsoDate(params.get('date_to')) ? (params.get('date_to') ?? undefined) : undefined,
    locationId: parsePositiveInt(params.get('location_id')),
    status: parseEnum(params.get('status'), ORDER_STATUSES),
    productId: parsePositiveInt(params.get('product_id')),
    minTotal: parseAmount(params.get('min_total')),
    maxTotal: parseAmount(params.get('max_total')),
  };
  return {
    filters,
    page: parsePositiveInt(params.get('page')) ?? 1,
    sort: parseEnum(params.get('sort'), ORDER_SORTS) ?? DEFAULT_SORT,
  };
}

/** New params with the given filters; resets the page, keeps the sort. */
export function withOrdersFilters(params: URLSearchParams, filters: OrdersFilterValues) {
  return withParams(params, {
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
    location_id: filters.locationId,
    status: filters.status,
    product_id: filters.productId,
    min_total: filters.minTotal,
    max_total: filters.maxTotal,
    page: undefined,
  });
}

export function hasOrdersFilters(filters: OrdersFilterValues): boolean {
  return Object.values(filters).some((value) => value !== undefined);
}
