import { formatNumber } from '../lib/format';
import { Button } from './Button';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, disabled, onPageChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Пагинация"
      className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm text-muted"
    >
      <span>
        {formatNumber(from)}–{formatNumber(to)} из {formatNumber(total)}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          className="h-9 px-3"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Предыдущая страница"
        >
          <ChevronLeftIcon width={16} height={16} />
        </Button>
        <span className="min-w-20 text-center text-ink">
          {formatNumber(page)} / {formatNumber(pageCount)}
        </span>
        <Button
          variant="secondary"
          className="h-9 px-3"
          disabled={disabled || page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Следующая страница"
        >
          <ChevronRightIcon width={16} height={16} />
        </Button>
      </div>
    </nav>
  );
}
