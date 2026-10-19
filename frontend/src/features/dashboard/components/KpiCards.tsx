import type { ReactNode } from 'react';

import {
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatShare,
} from '../../../shared/lib/format';
import { Card } from '../../../shared/ui/Card';
import { BagIcon, ReceiptIcon, StarIcon, WalletIcon } from '../../../shared/ui/icons';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useGetKpiQuery, type AnalyticsArgs } from '../api';
import { liveQueryOptions } from '../live';
import { DeltaBadge } from './DeltaBadge';
import { WidgetBody } from './WidgetBody';

interface KpiCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

function KpiCard({ title, icon, children }: KpiCardProps) {
  return (
    <Card className="flex min-h-44 flex-col">
      <header className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-[15px] font-medium text-ink-soft">{title}</h2>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink-soft">
          {icon}
        </span>
      </header>
      <div className="mt-auto">{children}</div>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="mt-4 h-6 w-48" />
    </div>
  );
}

function HeroValue({ children }: { children: ReactNode }) {
  // Proportional figures: tabular-nums looks loose at display sizes.
  return (
    <p className="mb-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{children}</p>
  );
}

interface KpiCardsProps {
  args: AnalyticsArgs;
  live?: boolean;
}

export function KpiCards({ args, live = false }: KpiCardsProps) {
  const query = useGetKpiQuery(args, liveQueryOptions(live));
  const kpi = query.data;

  const card = (title: string, icon: ReactNode, render: () => ReactNode) => (
    <KpiCard title={title} icon={icon}>
      <WidgetBody query={query} skeleton={<KpiSkeleton />}>
        {render}
      </WidgetBody>
    </KpiCard>
  );

  return (
    <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
      {card('Выручка', <WalletIcon />, () =>
        kpi ? (
          <>
            <HeroValue>{formatMoneyCompact(kpi.revenue.value)}</HeroValue>
            <DeltaBadge value={kpi.revenue.delta_pct} />
          </>
        ) : null,
      )}
      {card('Заказы', <BagIcon />, () =>
        kpi ? (
          <>
            <HeroValue>{formatNumber(kpi.orders.value)}</HeroValue>
            <DeltaBadge value={kpi.orders.delta_pct} />
          </>
        ) : null,
      )}
      {card('Средний чек', <ReceiptIcon />, () =>
        kpi ? (
          <>
            <HeroValue>{formatMoney(kpi.avg_check.value)}</HeroValue>
            <DeltaBadge value={kpi.avg_check.delta_pct} />
          </>
        ) : null,
      )}
      {card('Лучшая позиция', <StarIcon />, () =>
        kpi?.best_product ? (
          <>
            <p className="truncate text-2xl font-extrabold tracking-tight text-ink">
              {kpi.best_product.name}
            </p>
            <p className="mt-1 mb-3 text-sm text-muted">
              {formatNumber(kpi.best_product.quantity)} шт · {formatShare(kpi.best_product.share)}{' '}
              продаж
            </p>
            <DeltaBadge value={kpi.best_product.delta_pct} />
          </>
        ) : (
          <p className="text-sm text-muted">За период продаж нет</p>
        ),
      )}
    </div>
  );
}
