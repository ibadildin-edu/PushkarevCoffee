import { Link, useParams } from 'react-router';

import { formatDate, formatMoney, formatMoneyCompact, formatNumber } from '../../shared/lib/format';
import { parsePositiveInt } from '../../shared/lib/searchParams';
import { PageHeader, PageHeaderSkeleton } from '../../shared/layout/PageHeader';
import { ButtonLink } from '../../shared/ui/Button';
import { Card, CardHeader } from '../../shared/ui/Card';
import { ArrowLeftIcon } from '../../shared/ui/icons';
import { LoadingRegion, Skeleton } from '../../shared/ui/Skeleton';
import { EmptyState, ErrorState, NotFoundState, QueryErrorState } from '../../shared/ui/States';
import { useGetOrdersQuery } from '../orders/api';
import { OrdersTable } from '../orders/components/OrdersTable';
import { useGetLocationQuery, useGetLocationsQuery } from './api';
import { KpiStat } from './components/KpiStat';

const NOT_FOUND = {
  title: 'Точка не найдена',
  description: 'Такой кофейни нет в сети. Проверьте ссылку.',
  backTo: '/locations',
  backLabel: 'Ко всем точкам',
};

const RECENT_ORDERS_LIMIT = 10;

function BackLink() {
  return (
    <Link
      to="/locations"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
    >
      <ArrowLeftIcon width={16} height={16} />
      Все точки
    </Link>
  );
}

function LocationKpi({ locationId }: { locationId: number }) {
  // KPI comes with the list endpoint; it is usually already cached from the Locations page.
  const { kpi, isLoading, isError } = useGetLocationsQuery(undefined, {
    selectFromResult: ({ data, isLoading, isError }) => ({
      kpi: data?.find((location) => location.id === locationId)?.kpi_30d,
      isLoading,
      isError,
    }),
  });

  if (isError) return null;

  return (
    <Card>
      <CardHeader title="Показатели за 30 дней" />
      <dl className="grid gap-3 sm:grid-cols-3">
        {isLoading || !kpi ? (
          Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))
        ) : (
          <>
            <KpiStat label="Выручка" value={formatMoneyCompact(kpi.revenue)} />
            <KpiStat label="Заказы" value={formatNumber(kpi.orders)} />
            <KpiStat label="Средний чек" value={formatMoney(kpi.avg_check)} />
          </>
        )}
      </dl>
    </Card>
  );
}

function LocationRecentOrders({ locationId }: { locationId: number }) {
  const { data, error, isLoading, isError, refetch } = useGetOrdersQuery({
    location_id: locationId,
    page: 1,
    page_size: RECENT_ORDERS_LIMIT,
  });

  return (
    <Card>
      <CardHeader
        title="Последние заказы"
        aside={
          <ButtonLink to={`/orders?location_id=${locationId}`} variant="secondary" className="h-9">
            Все заказы →
          </ButtonLink>
        }
      />
      {isError ? (
        <ErrorState error={error} onRetry={refetch} compact />
      ) : data?.items.length === 0 ? (
        <EmptyState title="Заказов пока нет" compact />
      ) : (
        <OrdersTable
          orders={data?.items}
          isLoading={isLoading}
          showLocation={false}
          skeletonRows={RECENT_ORDERS_LIMIT}
        />
      )}
    </Card>
  );
}

export function LocationPage() {
  const params = useParams();
  const locationId = parsePositiveInt(params.id ?? null);
  const {
    data: location,
    error,
    isLoading,
    isError,
    refetch,
  } = useGetLocationQuery(locationId ?? 0, { skip: locationId === undefined });

  if (locationId === undefined) {
    return (
      <Card>
        <NotFoundState {...NOT_FOUND} />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <LoadingRegion label="Загрузка точки…">
        <BackLink />
        <div className="mt-3">
          <PageHeaderSkeleton />
        </div>
        <Card>
          <Skeleton className="h-16 rounded-2xl" />
        </Card>
      </LoadingRegion>
    );
  }

  if (isError || !location) {
    return (
      <Card>
        <QueryErrorState error={error} onRetry={refetch} notFound={NOT_FOUND} />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={<BackLink />}
        title={location.name}
        subtitle={`${location.address} · открыта ${formatDate(location.opened_at)}`}
        actions={
          <ButtonLink to={`/?location=${location.id}`} variant="secondary">
            Открыть на дашборде
          </ButtonLink>
        }
      />
      <div className="flex flex-col gap-5">
        <LocationKpi locationId={location.id} />
        <LocationRecentOrders locationId={location.id} />
      </div>
    </>
  );
}
