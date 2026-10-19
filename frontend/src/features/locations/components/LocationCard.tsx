import { Link } from 'react-router';

import type { LocationWithKpi } from '../../../api/types';
import {
  formatDate,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
} from '../../../shared/lib/format';
import { Badge } from '../../../shared/ui/Badge';
import { Card } from '../../../shared/ui/Card';
import { ArrowRightIcon, PinIcon } from '../../../shared/ui/icons';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { KpiStat } from './KpiStat';

export function LocationCard({ location }: { location: LocationWithKpi }) {
  const { kpi_30d: kpi } = location;

  return (
    <Link to={`/locations/${location.id}`} className="group block rounded-card">
      <Card className="h-full transition-shadow group-hover:shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-ink">{location.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <PinIcon width={16} height={16} className="shrink-0" />
              <span className="truncate">{location.address}</span>
            </p>
          </div>
          {!location.is_active && <Badge>Закрыта</Badge>}
        </div>

        <p className="mt-5 mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          За 30 дней
        </p>
        <dl className="grid grid-cols-3 gap-2">
          <KpiStat label="Выручка" value={formatMoneyCompact(kpi.revenue)} />
          <KpiStat label="Заказы" value={formatNumber(kpi.orders)} />
          <KpiStat label="Средний чек" value={formatMoney(kpi.avg_check)} />
        </dl>

        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-muted">Открыта {formatDate(location.opened_at)}</span>
          <span className="flex items-center gap-1 font-semibold text-ink group-hover:text-accent">
            Подробнее
            <ArrowRightIcon width={16} height={16} />
          </span>
        </div>
      </Card>
    </Link>
  );
}

export function LocationCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="mt-2 h-4 w-48" />
      <Skeleton className="mt-6 h-3 w-20" />
      <div className="mt-2 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-5 h-4 w-40" />
    </Card>
  );
}
