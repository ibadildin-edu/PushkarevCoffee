import { useSearchParams } from 'react-router';

import { formatNumber, pluralize } from '../../shared/lib/format';
import { withParams } from '../../shared/lib/searchParams';
import { PageHeader } from '../../shared/layout/PageHeader';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Pagination } from '../../shared/ui/Pagination';
import { Skeleton } from '../../shared/ui/Skeleton';
import { EmptyState, ErrorState } from '../../shared/ui/States';
import { useGetOrdersQuery } from './api';
import { OrdersFilters } from './components/OrdersFilters';
import { OrdersTable } from './components/OrdersTable';
import { DEFAULT_SORT, hasOrdersFilters, parseOrdersSearch, withOrdersFilters } from './urlFilters';

const PAGE_SIZE = 20;

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, page, sort } = parseOrdersSearch(searchParams);
  const filtered = hasOrdersFilters(filters);

  const { data, error, isLoading, isFetching, isError, refetch } = useGetOrdersQuery({
    page,
    page_size: PAGE_SIZE,
    sort,
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
    location_id: filters.locationId,
    status: filters.status,
    product_id: filters.productId,
    min_total: filters.minTotal,
    max_total: filters.maxTotal,
  });

  const resetFilters = () => setSearchParams(withOrdersFilters(new URLSearchParams(), {}));

  const changePage = (nextPage: number) => {
    setSearchParams(withParams(searchParams, { page: nextPage > 1 ? nextPage : undefined }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const subtitle = data ? (
    `${formatNumber(data.total)} ${pluralize(data.total, ['заказ', 'заказа', 'заказов'])}${filtered ? ' по фильтрам' : ''}`
  ) : isError ? (
    'История заказов всех точек'
  ) : (
    <Skeleton className="mt-1 h-4 w-28" />
  );

  return (
    <>
      <PageHeader title="Заказы" subtitle={subtitle} />
      <OrdersFilters
        value={filters}
        onApply={(next) => setSearchParams(withOrdersFilters(searchParams, next))}
        onReset={resetFilters}
        canReset={filtered}
      />
      <Card>
        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !isLoading && data?.items.length === 0 ? (
          <EmptyState
            title="Заказов не найдено"
            description={
              data.total > 0
                ? 'На этой странице пусто — вернитесь на первую.'
                : 'Под выбранные фильтры ничего не подходит. Попробуйте изменить их.'
            }
            action={
              data.total > 0 ? (
                <Button variant="secondary" onClick={() => changePage(1)}>
                  На первую страницу
                </Button>
              ) : (
                filtered && (
                  <Button variant="secondary" onClick={resetFilters}>
                    Сбросить фильтры
                  </Button>
                )
              )
            }
          />
        ) : (
          <>
            <OrdersTable
              orders={data?.items}
              isLoading={isLoading}
              isRefreshing={isFetching && !isLoading}
              sort={sort}
              onSortChange={(next) =>
                setSearchParams(
                  withParams(searchParams, {
                    sort: next === DEFAULT_SORT ? undefined : next,
                    page: undefined,
                  }),
                )
              }
            />
            {data && (
              <Pagination
                page={data.page}
                pageSize={data.page_size}
                total={data.total}
                disabled={isFetching}
                onPageChange={changePage}
              />
            )}
          </>
        )}
      </Card>
    </>
  );
}
