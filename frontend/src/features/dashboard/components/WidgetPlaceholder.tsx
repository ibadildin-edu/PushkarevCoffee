import type { ReactNode } from 'react';

import { cn } from '../../../shared/lib/cn';
import { Card, CardHeader } from '../../../shared/ui/Card';

interface WidgetPlaceholderProps {
  title: string;
  icon?: ReactNode;
  className?: string;
  /** Height of the empty body area. */
  bodyClassName?: string;
}

/**
 * Frame of a dashboard widget whose data source (/api/v1/analytics/*) is not built yet.
 * Replaced by the real widget in stage 5 of docs/PLAN.md.
 */
export function WidgetPlaceholder({
  title,
  icon,
  className,
  bodyClassName,
}: WidgetPlaceholderProps) {
  return (
    <Card className={className}>
      <CardHeader
        title={<span className="text-base font-medium text-ink-soft">{title}</span>}
        aside={
          icon && (
            <span className="flex size-10 items-center justify-center rounded-xl bg-surface-muted text-ink-soft">
              {icon}
            </span>
          )
        }
      />
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border border-dashed border-line px-4 text-center text-sm text-muted',
          bodyClassName ?? 'h-16',
        )}
      >
        Нет данных — аналитика ещё не подключена
      </div>
    </Card>
  );
}
