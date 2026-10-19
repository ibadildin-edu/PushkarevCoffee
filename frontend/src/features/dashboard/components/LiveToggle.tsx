import { cn } from '../../../shared/lib/cn';

interface LiveToggleProps {
  value: boolean;
  onChange: (live: boolean) => void;
}

export function LiveToggle({ value, onChange }: LiveToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex h-12 items-center gap-3 rounded-2xl border border-line bg-surface pr-2 pl-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
    >
      <span
        className={cn('size-2 rounded-full', value ? 'animate-pulse bg-accent' : 'bg-heat-1')}
        aria-hidden="true"
      />
      Live
      <span
        aria-hidden="true"
        className={cn(
          'relative h-7 w-12 rounded-full transition-colors',
          value ? 'bg-accent' : 'bg-heat-1',
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 size-5 rounded-full bg-surface transition-transform',
            value && 'translate-x-5',
          )}
        />
      </span>
    </button>
  );
}
