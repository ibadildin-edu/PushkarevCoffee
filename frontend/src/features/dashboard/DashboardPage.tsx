import { useEffect } from 'react';

import type { FiltersState } from '../filters/filtersSlice';
import { useDashboardFilters } from '../filters/useDashboardFilters';
import { useSetSimulatorMutation } from './api';
import { CategoryDonut } from './components/CategoryDonut';
import { DashboardHeader } from './components/DashboardHeader';
import { KpiCards } from './components/KpiCards';
import { LoadHeatmap } from './components/LoadHeatmap';
import { LocationsComparison } from './components/LocationsComparison';
import { RecentOrdersFeed } from './components/RecentOrdersFeed';
import { RevenueChart } from './components/RevenueChart';
import { TopProductsList } from './components/TopProductsList';
import { analyticsArgs } from './live';

export function DashboardPage() {
  const [filters, updateFilters] = useDashboardFilters();
  const [setSimulator, simulator] = useSetSimulatorMutation();
  const args = analyticsArgs(filters.period, filters.locationId);
  const { live } = filters;

  // Live on (also when opened via a ?live=1 link) starts the server-side order simulator.
  useEffect(() => {
    if (live) void setSimulator({ enabled: true });
  }, [live, setSimulator]);

  const changeFilters = (patch: Partial<FiltersState>) => {
    if (patch.live === false) void setSimulator({ enabled: false });
    updateFilters(patch);
  };

  return (
    <>
      <DashboardHeader filters={filters} onChange={changeFilters} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <KpiCards args={args} live={live} />
          <RevenueChart args={args} live={live} />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <TopProductsList args={args} live={live} />
            <CategoryDonut args={args} live={live} />
          </div>
          <LoadHeatmap args={args} live={live} />
          <LocationsComparison args={args} selectedId={filters.locationId} live={live} />
        </div>

        <aside className="min-w-0">
          <div className="xl:sticky xl:top-6">
            <RecentOrdersFeed
              locationId={filters.locationId}
              live={live}
              liveError={live && simulator.isError ? 'Симулятор недоступен' : undefined}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
