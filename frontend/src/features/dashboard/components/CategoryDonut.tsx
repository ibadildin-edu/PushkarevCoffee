import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { CategoryShare, CategoryShares } from '../../../api/types';
import { formatMoney, formatNumber, formatShare, pluralize } from '../../../shared/lib/format';
import { Card, CardHeader } from '../../../shared/ui/Card';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { EmptyState } from '../../../shared/ui/States';
import { useGetCategorySharesQuery, type AnalyticsArgs } from '../api';
import { liveQueryOptions } from '../live';
import { WidgetBody } from './WidgetBody';

const ITEM_FORMS = ['позиция', 'позиции', 'позиций'] as const;

function SliceTooltip({ item }: { item: CategoryShare }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm shadow-card">
      <p className="mb-1 flex items-center gap-2 font-semibold text-ink">
        {/* Category colours come from the API. */}
        <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
        {item.name}
      </p>
      <p className="text-ink-soft">
        {formatNumber(item.quantity)} шт · {formatShare(item.share)}
      </p>
      <p className="text-ink-soft">{formatMoney(item.revenue)}</p>
    </div>
  );
}

function Donut({ data, live }: { data: CategoryShares; live: boolean }) {
  // Pie reads `fill` from each entry.
  const slices = data.items
    .filter((item) => item.quantity > 0)
    .map((item) => ({ ...item, fill: item.color }));

  return (
    <>
      <div className="relative mx-auto size-48" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="quantity"
              nameKey="name"
              innerRadius="70%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="var(--color-surface)"
              strokeWidth={2}
              isAnimationActive={!live}
            />
            <Tooltip
              content={({ active, payload }) => {
                const item = payload?.[0]?.payload as CategoryShare | undefined;
                return active && item ? <SliceTooltip item={item} /> : null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-ink">
            {formatNumber(data.total_quantity)}
          </span>
          <span className="text-xs text-muted">{pluralize(data.total_quantity, ITEM_FORMS)}</span>
        </div>
      </div>

      {/* The legend doubles as the table view: every slice is labelled with count and share. */}
      <table className="mt-6 w-full text-[15px]">
        <caption className="sr-only">
          Доли категорий: всего {formatNumber(data.total_quantity)}{' '}
          {pluralize(data.total_quantity, ITEM_FORMS)}
        </caption>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.category_id}>
              <th scope="row" className="py-1.5 text-left font-normal text-ink">
                <span className="flex items-center gap-2.5">
                  <span
                    className="size-3 shrink-0 rounded"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  {item.name}
                </span>
              </th>
              <td className="py-1.5 text-right text-muted tabular-nums">
                {formatNumber(item.quantity)}
              </td>
              <td className="w-16 py-1.5 text-right font-semibold text-ink tabular-nums">
                {formatShare(item.share)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function DonutSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mx-auto size-48 rounded-full" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-5 w-full" />
        ))}
      </div>
    </div>
  );
}

export function CategoryDonut({ args, live = false }: { args: AnalyticsArgs; live?: boolean }) {
  const query = useGetCategorySharesQuery(args, liveQueryOptions(live));

  return (
    <Card>
      <CardHeader title="Доли категорий" />
      <WidgetBody
        query={query}
        skeleton={<DonutSkeleton />}
        isEmpty={!query.data?.total_quantity}
        empty={<EmptyState compact title="Продаж пока нет" />}
      >
        {() => (query.data ? <Donut data={query.data} live={live} /> : null)}
      </WidgetBody>
    </Card>
  );
}
