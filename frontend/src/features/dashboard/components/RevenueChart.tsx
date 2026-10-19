import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { RevenueDaily, RevenuePoint } from '../../../api/types';
import { addDays } from '../../../shared/lib/dates';
import {
  formatDayMonth,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatNumberCompact,
  formatWeekdayDate,
} from '../../../shared/lib/format';
import { Card, CardHeader } from '../../../shared/ui/Card';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { EmptyState } from '../../../shared/ui/States';
import { useGetRevenueDailyQuery, type AnalyticsArgs } from '../api';
import { liveQueryOptions } from '../live';
import { WidgetBody } from './WidgetBody';

const CHART_HEIGHT = 300;
const Y_TICKS = 4;

/** Round axis ticks: 0, 200 тыс, 400 тыс… instead of 0, 65 тыс, 130 тыс… */
function niceTicks(max: number): number[] {
  if (max <= 0) return [0];
  const rough = max / Y_TICKS;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((value) => value >= rough) ??
    10 * magnitude;
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, index) => index * step);
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
      <li className="flex items-center gap-2">
        <span className="h-0.5 w-5 rounded-full bg-accent" aria-hidden="true" />
        Текущий период
      </li>
      <li className="flex items-center gap-2">
        <span className="w-5 border-t-2 border-dashed border-muted" aria-hidden="true" />
        Прошлый период
      </li>
    </ul>
  );
}

function ChartTooltip({ point, days }: { point: RevenuePoint; days: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm shadow-card">
      <p className="mb-2 font-semibold text-ink">{formatWeekdayDate(point.date)}</p>
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1">
        <dt className="flex items-center gap-2 text-ink-soft">
          <span className="h-0.5 w-3 rounded-full bg-accent" aria-hidden="true" />
          Выручка
        </dt>
        <dd className="text-right font-semibold text-ink tabular-nums">
          {formatMoney(point.revenue)}
        </dd>
        <dt className="text-ink-soft">Заказов</dt>
        <dd className="text-right text-ink tabular-nums">{formatNumber(point.orders)}</dd>
        <dt className="flex items-center gap-2 text-ink-soft">
          <span className="w-3 border-t-2 border-dashed border-muted" aria-hidden="true" />
          {formatDayMonth(addDays(point.date, -days))}
        </dt>
        <dd className="text-right text-ink-soft tabular-nums">{formatMoney(point.prev_revenue)}</dd>
      </dl>
    </div>
  );
}

function Chart({ data, live }: { data: RevenueDaily; live: boolean }) {
  const days = data.points.length;
  const short = days <= 7;
  const ticks = niceTicks(
    Math.max(...data.points.map((point) => Math.max(point.revenue, point.prev_revenue))),
  );

  return (
    <>
      <div style={{ height: CHART_HEIGHT }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.points} margin={{ top: 8, right: 28, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) =>
                short ? formatWeekdayDate(value) : formatDayMonth(value)
              }
              tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-line)' }}
              tickMargin={10}
              minTickGap={short ? 4 : 28}
              interval={short ? 0 : 'preserveStartEnd'}
            />
            <YAxis
              ticks={ticks}
              domain={[0, ticks[ticks.length - 1] ?? 0]}
              tickFormatter={(value: number) => formatNumberCompact(value)}
              tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-heat-2)', strokeWidth: 1 }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as RevenuePoint | undefined;
                return active && point ? <ChartTooltip point={point} days={days} /> : null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-accent)"
              strokeWidth={2}
              fill="var(--color-accent-soft)"
              fillOpacity={0.8}
              activeDot={{ r: 5, stroke: 'var(--color-surface)', strokeWidth: 2 }}
              isAnimationActive={!live}
            />
            <Line
              type="monotone"
              dataKey="prev_revenue"
              stroke="var(--color-muted)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4, stroke: 'var(--color-surface)', strokeWidth: 2 }}
              isAnimationActive={!live}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Table twin of the chart for screen readers. */}
      <table className="sr-only">
        <caption>Выручка по дням</caption>
        <thead>
          <tr>
            <th>День</th>
            <th>Выручка</th>
            <th>Заказов</th>
            <th>Прошлый период</th>
          </tr>
        </thead>
        <tbody>
          {data.points.map((point) => (
            <tr key={point.date}>
              <td>{formatWeekdayDate(point.date)}</td>
              <td>{formatMoney(point.revenue)}</td>
              <td>{formatNumber(point.orders)}</td>
              <td>{formatMoney(point.prev_revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function RevenueChart({ args, live = false }: { args: AnalyticsArgs; live?: boolean }) {
  const query = useGetRevenueDailyQuery(args, liveQueryOptions(live));
  const data = query.data;

  const subtitle = data?.max
    ? `В среднем ${formatMoneyCompact(data.avg)} в день · максимум ${formatMoneyCompact(data.max.value)} (${formatDayMonth(data.max.date)})`
    : query.isLoading
      ? undefined
      : 'Выручка без отменённых заказов';

  return (
    <Card>
      <CardHeader title="Выручка по дням" subtitle={subtitle} aside={<Legend />} wrap />
      <WidgetBody
        query={query}
        skeleton={<Skeleton className="h-[300px] w-full rounded-2xl" />}
        isEmpty={!data?.max}
        empty={
          <EmptyState
            compact
            title="За период нет продаж"
            description="Выберите другой период или точку."
          />
        }
      >
        {() => (data ? <Chart data={data} live={live} /> : null)}
      </WidgetBody>
    </Card>
  );
}
