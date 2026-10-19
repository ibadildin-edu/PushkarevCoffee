import { cn } from '../../../shared/lib/cn';
import { PERIODS, type Period } from '../../filters/filtersSlice';

interface PeriodSwitcherProps {
  value: Period;
  onChange: (period: Period) => void;
}

export function PeriodSwitcher({ value, onChange }: PeriodSwitcherProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Период"
      className="flex h-12 rounded-2xl bg-surface-muted p-1"
    >
      {PERIODS.map((period) => {
        const active = period === value;
        return (
          <button
            key={period}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(period)}
            className={cn(
              'rounded-xl px-4 text-sm font-medium transition-colors',
              active ? 'bg-surface text-ink shadow-card' : 'text-ink-soft hover:text-ink',
            )}
          >
            {period} дней
          </button>
        );
      })}
    </div>
  );
}
