import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';
import { Skeleton } from './Skeleton';

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className={cn('w-full min-w-[640px] text-left text-sm', className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-line px-5 pb-3 text-xs font-medium tracking-wide text-muted uppercase first:pl-5 sm:px-6',
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<'td'>) {
  return (
    <td
      className={cn('border-b border-line px-5 py-3.5 align-middle text-ink sm:px-6', className)}
      {...props}
    />
  );
}

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export function TableSkeletonRows({ columns, rows = 8 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row}>
          {Array.from({ length: columns }, (_, col) => (
            <Td key={col}>
              <Skeleton className={cn('h-4', col === 0 ? 'w-16' : 'w-full max-w-28')} />
            </Td>
          ))}
        </tr>
      ))}
    </>
  );
}
