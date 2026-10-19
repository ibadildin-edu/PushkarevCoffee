import { Link } from 'react-router';

import type { RecentOrder } from '../../../api/types';
import { cn } from '../../../shared/lib/cn';
import {
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatTime,
} from '../../../shared/lib/format';
import { Badge } from '../../../shared/ui/Badge';
import { ButtonLink } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { ArrowRightIcon } from '../../../shared/ui/icons';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { EmptyState } from '../../../shared/ui/States';
import { useGetRecentOrdersQuery } from '../../orders/api';
import { OrderStatusBadge } from '../../orders/components/OrderStatusBadge';
import { liveQueryOptions } from '../live';
import { WidgetBody } from './WidgetBody';

const LIMIT = 10;

interface RecentOrdersFeedProps {
  locationId: number | null;
  live: boolean;
  /** Shown when the simulator could not be switched on. */
  liveError?: string;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-surface-muted px-3.5 py-3">
      <p className="truncate text-xs text-muted">{label}</p>
      <p className="mt-0.5 truncate text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

function FeedItem({ order }: { order: RecentOrder }) {
  return (
    <li>
      <Link
        to={`/orders/${order.id}`}
        className="block rounded-2xl px-1 py-3.5 transition-colors hover:bg-surface-muted/60"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px]">
            <span className="font-bold text-ink">#{order.number}</span>
            <span className="text-muted"> · {formatTime(order.created_at)}</span>
          </p>
          <p className="font-semibold whitespace-nowrap text-ink tabular-nums">
            {formatMoney(order.total_amount)}
          </p>
        </div>
        <p className="mt-0.5 truncate text-sm text-ink-soft">{order.items_summary}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge>{order.location_name}</Badge>
          <OrderStatusBadge status={order.status} />
        </div>
      </Link>
    </li>
  );
}

function FeedSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
      <div className="mt-4 space-y-5">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentOrdersFeed({ locationId, live, liveError }: RecentOrdersFeedProps) {
  const query = useGetRecentOrdersQuery(
    { location_id: locationId ?? undefined, limit: LIMIT },
    liveQueryOptions(live),
  );
  const data = query.data;
  const ordersLink = locationId ? `/orders?location_id=${locationId}` : '/orders';

  return (
    <Card className="flex flex-col">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Последние заказы</h2>
        {liveError ? (
          <span className="text-xs text-danger">{liveError}</span>
        ) : (
          <span
            className={cn(
              'flex items-center gap-1.5 text-xs',
              live ? 'text-ink-soft' : 'text-muted',
            )}
          >
            <span
              aria-hidden="true"
              className={cn('size-2 rounded-full', live ? 'animate-pulse bg-accent' : 'bg-heat-1')}
            />
            {live ? 'обновляется' : 'Live выключен'}
          </span>
        )}
      </header>

      <WidgetBody query={query} skeleton={<FeedSkeleton />}>
        {() =>
          data ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Сегодня, заказов" value={formatNumber(data.today.orders)} />
                <Stat label="Выручка" value={formatMoneyCompact(data.today.revenue)} />
              </div>
              {data.items.length === 0 ? (
                <EmptyState compact title="Заказов пока нет" />
              ) : (
                <ul
                  className="mt-3 divide-y divide-line"
                  aria-live={live ? 'polite' : undefined}
                  aria-label="Лента заказов"
                >
                  {data.items.map((order) => (
                    <FeedItem key={order.id} order={order} />
                  ))}
                </ul>
              )}
            </>
          ) : null
        }
      </WidgetBody>

      <ButtonLink to={ordersLink} variant="secondary" className="mt-4 w-full">
        Все заказы
        <ArrowRightIcon width={16} height={16} />
      </ButtonLink>
    </Card>
  );
}
