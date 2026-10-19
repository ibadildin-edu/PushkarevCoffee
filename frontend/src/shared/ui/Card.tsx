import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('rounded-card bg-surface p-5 shadow-card sm:p-6', className)}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  aside?: ReactNode;
  /** Stack the aside under the title on narrow screens. */
  wrap?: boolean;
}

export function CardHeader({ title, subtitle, aside, wrap }: CardHeaderProps) {
  return (
    <header
      className={cn(
        'mb-4 flex gap-4',
        wrap
          ? 'flex-col md:flex-row md:items-start md:justify-between'
          : 'items-start justify-between',
      )}
    >
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  );
}
