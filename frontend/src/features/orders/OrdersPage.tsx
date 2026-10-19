import { useSearchParams } from 'react-router';

import { ORDER_STATUSES } from '../../api/types';
import { formatNumber, pluralize } from '../../shared/lib/format';
import { parseEnum, parsePositiveInt, withParams } from '../../shared/lib/searchParams';
import { PageHeader } from '../../shared/layout/PageHeader';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Pagination } from '../../shared/ui/Pagination';
import { Skeleton } from '../../shared/ui/Skeleton';
import { EmptyState, ErrorState } from '../../shared/ui/States';
import { useGetOrdersQuery } from './api';
import { OrdersFilters, type OrdersFilterValues } from './components/OrdersFilters';
import { OrdersTable } from './components/OrdersTable';

const PAGE_SIZE = 20;

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePositiveInt(searchParams.get('page')) ?? 1;
  const filters: OrdersFilterValues = {
    status: parseEnum(searchParams.get('status'), ORDER_STATUSES),
    locationId: parsePositiveInt(searchParams.get('location_id')),
  };

  const { data, error, isLoading, isFetching, isError, refetch } = useGetOrdersQuery({
    page,
    page_size: PAGE_SIZE,
    status: filters.status,
    location_id: filters.locationId,
  });

  const changeFilters = (patch: OrdersFilterValues) => {
    const next = { ...filters, ...patch };
    // Any filter change starts from the first page.
    setSearchParams(
      withParams(searchParams, {
        status: next.status,
        location_id: next.locationId,
        page: undefined,
      }),
    );
  };

  const changePage = (nextPage: number) => {
    setSearchParams(withParams(searchParams, { page: nextPage > 1 ? nextPage : undefined }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const subtitle = data ? (
    `${formatNumber(data.total)} ${pluralize(data.total, ['заказ', 'заказа', 'заказов'])}`
  ) : isError ? (
    'История заказов всех точек'
  ) : (
    <Skeleton className="mt-1 h-4 w-28" />
  );

  return (
    <>
      <PageHeader
        title="Заказы"
        subtitle={subtitle}
        actions={
          <OrdersFilters
            value={filters}
            onChange={changeFilters}
            onReset={() => setSearchParams(new URLSearchParams())}
          />
        }
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
              <Button variant="secondary" onClick={() => setSearchParams(new URLSearchParams())}>
                Сбросить фильтры
              </Button>
            }
          />
        ) : (
          <>
            <OrdersTable
              orders={data?.items}
              isLoading={isLoading}
              isRefreshing={isFetching && !isLoading}
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
