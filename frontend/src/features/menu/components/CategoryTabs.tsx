import type { ReactNode } from 'react';

import type { Category } from '../../../api/types';
import { cn } from '../../../shared/lib/cn';
import { Skeleton } from '../../../shared/ui/Skeleton';

interface CategoryTabsProps {
  categories: Category[] | undefined;
  isLoading: boolean;
  value: number | undefined;
  onChange: (categoryId: number | undefined) => void;
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium whitespace-nowrap transition-colors',
        active
          ? 'bg-espresso text-on-dark'
          : 'bg-surface text-ink-soft hover:bg-surface-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

export function CategoryTabs({ categories, isLoading, value, onChange }: CategoryTabsProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Категории"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
    >
      <Tab active={value === undefined} onClick={() => onChange(undefined)}>
        Все
      </Tab>
      {categories?.map((category) => (
        <Tab key={category.id} active={value === category.id} onClick={() => onChange(category.id)}>
          {/* Category colour is data from the API, not a theme token. */}
          <span className="size-2.5 rounded-full" style={{ backgroundColor: category.color }} />
          {category.name}
        </Tab>
      ))}
    </div>
  );
}
