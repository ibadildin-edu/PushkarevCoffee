import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';
import { ChevronDownIcon } from './icons';

type SelectProps = ComponentProps<'select'>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className={cn('relative', className)}>
      <select
        className="h-12 w-full cursor-pointer appearance-none rounded-2xl border border-line bg-surface pr-10 pl-4 text-sm font-medium text-ink transition-colors hover:border-heat-1 disabled:cursor-not-allowed disabled:opacity-60"
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        width={18}
        height={18}
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-soft"
      />
    </div>
  );
}
