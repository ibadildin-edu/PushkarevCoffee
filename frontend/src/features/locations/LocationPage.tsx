import { Link, useParams, useSearchParams } from 'react-router';

import { formatDate, formatDayMonth } from '../../shared/lib/format';
import { parseEnum, parsePositiveInt, withParams } from '../../shared/lib/searchParams';
import { PageHeader, PageHeaderSkeleton } from '../../shared/layout/PageHeader';
import { ButtonLink } from '../../shared/ui/Button';
import { Card, CardHeader } from '../../shared/ui/Card';
import { ArrowLeftIcon } from '../../shared/ui/icons';
import { LoadingRegion, Skeleton } from '../../shared/ui/Skeleton';
import { EmptyState, ErrorState, NotFoundState, QueryErrorState } from '../../shared/ui/States';
import { useGetOrdersQuery } from '../orders/api';
import { OrdersTable } from '../orders/components/OrdersTable';
import { CategoryDonut } from '../dashboard/components/CategoryDonut';
import { KpiCards } from '../dashboard/components/KpiCards';
import { LoadHeatmap } from '../dashboard/components/LoadHeatmap';
import { PeriodSwitcher } from '../dashboard/components/PeriodSwitcher';
import { RevenueChart } from '../dashboard/components/RevenueChart';
import { TopProductsList } from '../dashboard/components/TopProductsList';
import { analyticsArgs } from '../dashboard/live';
import { initialFiltersState, PERIODS, type Period } from '../filters/filtersSlice';
import { useGetLocationQuery } from './api';

const NOT_FOUND = {
  title: 'Точка не найдена',
  description: 'Такой кофейни нет в сети. Проверьте ссылку.',
  backTo: '/locations',
  backLabel: 'Ко всем точкам',
};

const RECENT_ORDERS_LIMIT = 10;
const PERIOD_VALUES = PERIODS.map(String);

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
  // The page has its own period (?period=30), independent of the dashboard filters.
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = parseEnum(searchParams.get('period'), PERIOD_VALUES);
  const period = (periodParam ? Number(periodParam) : initialFiltersState.period) as Period;
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

  const args = analyticsArgs(period, location.id);

  return (
    <>
      <PageHeader
        eyebrow={<BackLink />}
        title={location.name}
        subtitle={`${location.address} · открыта ${formatDate(location.opened_at)} · ${formatDayMonth(args.date_from)} — ${formatDate(args.date_to)}`}
        actions={
          <>
            <PeriodSwitcher
              value={period}
              onChange={(next) =>
                setSearchParams(withParams(searchParams, { period: next }), { replace: true })
              }
            />
            <ButtonLink
              to={`/?period=${period}&location=${location.id}`}
              variant="secondary"
              className="h-12"
            >
              Открыть на дашборде
            </ButtonLink>
          </>
        }
      />
      <div className="flex flex-col gap-5">
        <KpiCards args={args} />
        <RevenueChart args={args} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <TopProductsList args={args} />
          <CategoryDonut args={args} />
        </div>
        <LoadHeatmap args={args} />
        <LocationRecentOrders locationId={location.id} />
      </div>
    </>
  );
}
