import type { Heatmap, HeatmapCell } from '../../../api/types';
import { cn } from '../../../shared/lib/cn';
import { WEEKDAYS_SHORT } from '../../../shared/lib/dates';
import { formatNumber } from '../../../shared/lib/format';
import { Card, CardHeader } from '../../../shared/ui/Card';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { EmptyState } from '../../../shared/ui/States';
import { useGetHeatmapQuery, type AnalyticsArgs } from '../api';
import { liveQueryOptions } from '../live';
import { WidgetBody } from './WidgetBody';

const HOURS = Array.from({ length: 16 }, (_, index) => index + 7);
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
// One hue, light -> dark (sequential).
const LEVELS = ['bg-heat-0', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4'] as const;

const decimal = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

function level(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(LEVELS.length - 1, Math.floor((value / max) * LEVELS.length));
}

function cellLabel(cell: HeatmapCell): string {
  return `${WEEKDAYS_SHORT[cell.weekday]}, ${cell.hour}:00–${cell.hour + 1}:00: в среднем ${decimal.format(cell.avg_orders)} заказа в час`;
}

function Scale() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted" aria-hidden="true">
      меньше
      {LEVELS.map((cls) => (
        <span key={cls} className={cn('h-3 w-5 rounded', cls)} />
      ))}
      больше
    </div>
  );
}

function Grid({ data }: { data: Heatmap }) {
  const byKey = new Map(data.cells.map((cell) => [`${cell.weekday}-${cell.hour}`, cell]));
  const max = Math.max(...data.cells.map((cell) => cell.avg_orders), 0);

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-1">
        <caption className="sr-only">Среднее число заказов по дням недели и часам</caption>
        <thead>
          <tr>
            {/* table-fixed takes column widths from this first row: equal hour columns. */}
            <td className="w-10" />
            {HOURS.map((hour) => (
              <th key={hour} scope="col" className="pb-1 text-xs font-normal text-muted">
                {hour}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WEEKDAYS.map((weekday) => (
            <tr key={weekday}>
              <th scope="row" className="w-8 pr-2 text-left text-sm font-normal text-ink-soft">
                {WEEKDAYS_SHORT[weekday]}
              </th>
              {HOURS.map((hour) => {
                const cell = byKey.get(`${weekday}-${hour}`) ?? {
                  weekday,
                  hour,
                  avg_orders: 0,
                };
                const label = cellLabel(cell);
                return (
                  <td
                    key={hour}
                    title={label}
                    aria-label={label}
                    className={cn(
                      'h-8 rounded-lg transition-transform hover:scale-110 hover:ring-2 hover:ring-surface',
                      LEVELS[level(cell.avg_orders, max)],
                    )}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-16 gap-1" aria-hidden="true">
      {Array.from({ length: 7 * 16 }, (_, index) => (
        <Skeleton key={index} className="h-8 rounded-lg" />
      ))}
    </div>
  );
}

export function LoadHeatmap({ args, live = false }: { args: AnalyticsArgs; live?: boolean }) {
  const query = useGetHeatmapQuery(args, liveQueryOptions(live));
  const peak = query.data?.peak;

  return (
    <Card>
      <CardHeader
        title="Загрузка по часам"
        subtitle={
          peak
            ? `Среднее число заказов в час · пик: ${WEEKDAYS_SHORT[peak.weekday]}, ${peak.hour}:00 · ≈${formatNumber(Math.round(peak.avg_orders))} заказов в час`
            : 'Среднее число заказов в час'
        }
        aside={<Scale />}
        wrap
      />
      <WidgetBody
        query={query}
        skeleton={<GridSkeleton />}
        isEmpty={!peak}
        empty={<EmptyState compact title="За период заказов нет" />}
      >
        {() => (query.data ? <Grid data={query.data} /> : null)}
      </WidgetBody>
    </Card>
  );
}
