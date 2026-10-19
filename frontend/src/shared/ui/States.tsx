import type { ReactNode } from 'react';

import { getErrorMessage, isNotFound, type ApiError } from '../lib/apiError';
import { cn } from '../lib/cn';
import { Button, ButtonLink } from './Button';
import { AlertIcon, RefreshIcon, SearchOffIcon } from './icons';

interface StateBoxProps {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  role?: 'alert';
}

function StateBox({
  icon,
  iconClassName,
  title,
  description,
  action,
  compact,
  role,
}: StateBoxProps) {
  return (
    <div
      role={role}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 py-8' : 'gap-3 py-16',
      )}
    >
      <div className={cn('flex size-12 items-center justify-center rounded-2xl', iconClassName)}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  error: ApiError;
  title?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({
  error,
  title = 'Не удалось загрузить данные',
  onRetry,
  compact,
}: ErrorStateProps) {
  return (
    <StateBox
      role="alert"
      compact={compact}
      icon={<AlertIcon />}
      iconClassName="bg-danger-soft text-danger"
      title={title}
      description={getErrorMessage(error)}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RefreshIcon width={16} height={16} />
            Повторить
          </Button>
        )
      }
    />
  );
}

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ title, description, action, compact }: EmptyStateProps) {
  return (
    <StateBox
      compact={compact}
      icon={<SearchOffIcon />}
      iconClassName="bg-surface-muted text-muted"
      title={title}
      description={description}
      action={action}
    />
  );
}

interface NotFoundStateProps {
  title: string;
  description?: string;
  backTo: string;
  backLabel: string;
}

export function NotFoundState({ title, description, backTo, backLabel }: NotFoundStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        <ButtonLink to={backTo} variant="secondary">
          {backLabel}
        </ButtonLink>
      }
    />
  );
}

/** Picks NotFoundState for 404 and ErrorState with retry otherwise. */
export function QueryErrorState({
  error,
  onRetry,
  notFound,
}: {
  error: ApiError;
  onRetry: () => void;
  notFound: NotFoundStateProps;
}) {
  if (isNotFound(error)) return <NotFoundState {...notFound} />;
  return <ErrorState error={error} onRetry={onRetry} />;
}
