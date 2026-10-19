import type { ReactNode } from 'react';

interface KpiStatProps {
  label: string;
  value: ReactNode;
}

export function KpiStat({ label, value }: KpiStatProps) {
  return (
    <div className="min-w-0 rounded-2xl bg-surface-muted px-3.5 py-3">
      <dt className="truncate text-xs text-muted">{label}</dt>
      <dd className="mt-1 truncate text-lg font-bold text-ink tabular-nums">{value}</dd>
    </div>
  );
}
