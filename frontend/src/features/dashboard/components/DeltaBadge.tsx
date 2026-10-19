import { formatPercent } from '../../../shared/lib/format';
import { Badge } from '../../../shared/ui/Badge';

interface DeltaBadgeProps {
  value: number | null;
  /** Text after the badge. */
  caption?: string;
}

export function DeltaBadge({ value, caption = 'к прошлому периоду' }: DeltaBadgeProps) {
  if (value === null) {
    return <p className="text-sm text-muted">Нет данных для сравнения</p>;
  }
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const label = direction === 'up' ? 'Рост' : direction === 'down' ? 'Снижение' : 'Без изменений';

  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
      <Badge
        tone={direction === 'up' ? 'success' : direction === 'down' ? 'danger' : 'neutral'}
        className="text-[13px] font-semibold"
      >
        <span aria-hidden="true">
          {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'}
        </span>
        <span className="sr-only">{label}</span>
        {formatPercent(Math.abs(value))}
      </Badge>
      {caption}
    </p>
  );
}
