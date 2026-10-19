import type { ReactNode } from 'react';

import type { ApiError } from '../../../shared/lib/apiError';
import { cn } from '../../../shared/lib/cn';
import { LoadingRegion } from '../../../shared/ui/Skeleton';
import { ErrorState } from '../../../shared/ui/States';

export interface WidgetQuery {
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error?: ApiError;
  /** undefined while data for the current args is still loading. */
  currentData?: unknown;
  refetch: () => unknown;
}

interface WidgetBodyProps {
  query: WidgetQuery;
  skeleton: ReactNode;
  /** Rendered instead of children when the data is empty. */
  empty?: ReactNode;
  isEmpty?: boolean;
  children: () => ReactNode;
}

/**
 * Loading / error / empty states shared by dashboard widgets.
 * On filter change the previous render stays visible (dimmed) instead of flashing a skeleton;
 * background polling does not dim anything.
 */
export function WidgetBody({ query, skeleton, empty, isEmpty, children }: WidgetBodyProps) {
  if (query.isLoading) return <LoadingRegion label="Загрузка данных…">{skeleton}</LoadingRegion>;
  if (query.isError) {
    return <ErrorState compact error={query.error} onRetry={() => void query.refetch()} />;
  }
  const isStale = query.isFetching && query.currentData === undefined;
  return (
    <div
      aria-busy={isStale}
      className={cn('transition-opacity duration-200', isStale && 'opacity-50')}
    >
      {isEmpty ? empty : children()}
    </div>
  );
}
