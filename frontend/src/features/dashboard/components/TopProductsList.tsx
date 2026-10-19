import type { TopProduct } from '../../../api/types';
import { cn } from '../../../shared/lib/cn';
import { formatMoney, formatNumber } from '../../../shared/lib/format';
import { Card, CardHeader } from '../../../shared/ui/Card';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { EmptyState } from '../../../shared/ui/States';
import { useGetTopProductsQuery, type AnalyticsArgs } from '../api';
import { liveQueryOptions } from '../live';
import { WidgetBody } from './WidgetBody';

const LIMIT = 10;

function Row({ product, rank, max }: { product: TopProduct; rank: number; max: number }) {
  const width = max > 0 ? Math.max((product.quantity / max) * 100, 3) : 0;
  return (
    <li
      className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(4rem,9rem)_3.5rem] items-center gap-3 rounded-lg py-1.5 text-[15px] hover:bg-surface-muted/60"
      title={`${product.name}: ${formatNumber(product.quantity)} шт · ${formatMoney(product.revenue)}`}
    >
      <span className="text-sm text-muted tabular-nums">{rank}</span>
      <span className="truncate text-ink">{product.name}</span>
      <span className="h-2 rounded-full bg-surface-muted" aria-hidden="true">
        <span
          className={cn('block h-full rounded-full', rank === 1 ? 'bg-accent' : 'bg-latte')}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="text-right font-semibold text-ink tabular-nums">
        {formatNumber(product.quantity)}
      </span>
    </li>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3.5" aria-hidden="true">
      {Array.from({ length: LIMIT }, (_, index) => (
        <Skeleton key={index} className="h-5 w-full" />
      ))}
    </div>
  );
}

export function TopProductsList({ args, live = false }: { args: AnalyticsArgs; live?: boolean }) {
  const query = useGetTopProductsQuery({ ...args, limit: LIMIT }, liveQueryOptions(live));
  const products = query.data ?? [];
  const max = products[0]?.quantity ?? 0;

  return (
    <Card>
      <CardHeader
        title="Топ-10 позиций"
        aside={<span className="text-sm text-muted">продано, шт</span>}
      />
      <WidgetBody
        query={query}
        skeleton={<ListSkeleton />}
        isEmpty={products.length === 0}
        empty={<EmptyState compact title="Продаж пока нет" />}
      >
        {() => (
          <ol aria-label="Топ-10 позиций по количеству продаж">
            {products.map((product, index) => (
              <Row key={product.product_id} product={product} rank={index + 1} max={max} />
            ))}
          </ol>
        )}
      </WidgetBody>
    </Card>
  );
}
