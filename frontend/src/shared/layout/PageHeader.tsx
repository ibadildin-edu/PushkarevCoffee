import type { ReactNode } from 'react';

import { Skeleton } from '../ui/Skeleton';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Controls on the right: filters, buttons. */
  actions?: ReactNode;
  /** Content above the title, e.g. a back link. */
  eyebrow?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:mb-8 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {subtitle && <div className="mt-1.5 text-[15px] text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 lg:mb-8" aria-hidden="true">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="mt-3 h-4 w-72" />
    </div>
  );
}
