import { Link } from 'react-router';

import type { LocationComparison } from '../../../api/types';
import { cn } from '../../../shared/lib/cn';
import { formatMoney, formatMoneyCompact, formatNumber } from '../../../shared/lib/format';
import { Card, CardHeader } from '../../../shared/ui/Card';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useGetLocationsComparisonQuery, type AnalyticsArgs } from '../api';
import { liveQueryOptions } from '../live';
import { DeltaBadge } from './DeltaBadge';
import { WidgetBody } from './WidgetBody';

interface LocationsComparisonProps {
  args: AnalyticsArgs;
  /** Highlighted location (the one selected in the dashboard filter). */
  selectedId: number | null;
  live?: boolean;
}

function Row({
  item,
  max,
  selected,
}: {
  item: LocationComparison;
  max: number;
  selected: boolean;
}) {
  const width = max > 0 ? Math.max((item.revenue / max) * 100, 2) : 0;
  return (
    <li className="grid gap-x-4 gap-y-2 py-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
      <Link
        to={`/locations/${item.location_id}`}
        className="truncate font-semibold text-ink hover:text-accent"
      >
        {item.name}
      </Link>
      <div className="flex items-center gap-3">
        <span className="h-2.5 flex-1 rounded-full bg-surface-muted" aria-hidden="true">
          <span
            className={cn('block h-full rounded-full', selected ? 'bg-accent' : 'bg-latte')}
            style={{ width: `${width}%` }}
          />
        </span>
        <span className="w-24 text-right font-semibold text-ink tabular-nums">
          {formatMoneyCompact(item.revenue)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted sm:justify-end">
        <span className="tabular-nums">{formatNumber(item.orders)} заказов</span>
        <span className="tabular-nums">чек {formatMoney(item.avg_check)}</span>
        <DeltaBadge value={item.delta_pct} caption="" />
      </div>
    </li>
  );
}

export function LocationsComparison({ args, selectedId, live = false }: LocationsComparisonProps) {
  // The comparison always covers all locations.
  const query = useGetLocationsComparisonQuery(
    { date_from: args.date_from, date_to: args.date_to },
    liveQueryOptions(live),
  );
  const items = query.data ?? [];
  const max = Math.max(...items.map((item) => item.revenue), 0);

  return (
    <Card>
      <CardHeader
        title="Сравнение точек"
        subtitle="Выручка за период и изменение к прошлому периоду"
      />
      <WidgetBody
        query={query}
        skeleton={
          <div className="space-y-4" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        }
      >
        {() => (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <Row
                key={item.location_id}
                item={item}
                max={max}
                selected={item.location_id === selectedId}
              />
            ))}
          </ul>
        )}
      </WidgetBody>
    </Card>
  );
}
