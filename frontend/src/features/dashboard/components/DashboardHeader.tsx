import { periodRange } from '../../../shared/lib/dates';
import { formatDate, formatDayMonth } from '../../../shared/lib/format';
import { PageHeader } from '../../../shared/layout/PageHeader';
import type { FiltersState } from '../../filters/filtersSlice';
import { useGetLocationsQuery } from '../../locations/api';
import { LiveToggle } from './LiveToggle';
import { LocationSelect } from './LocationSelect';
import { PeriodSwitcher } from './PeriodSwitcher';

interface DashboardHeaderProps {
  filters: FiltersState;
  onChange: (patch: Partial<FiltersState>) => void;
}

export function DashboardHeader({ filters, onChange }: DashboardHeaderProps) {
  const { data: locations, isLoading, isError } = useGetLocationsQuery();
  const { dateFrom, dateTo } = periodRange(filters.period);
  const locationName = locations?.find((location) => location.id === filters.locationId)?.name;
  const scope = locationName ? `точка «${locationName}»` : 'все точки';

  return (
    <PageHeader
      title="Дашборд"
      subtitle={`${formatDayMonth(dateFrom)} — ${formatDate(dateTo)} · ${scope}`}
      actions={
        <>
          <PeriodSwitcher value={filters.period} onChange={(period) => onChange({ period })} />
          <LocationSelect
            value={filters.locationId}
            locations={locations}
            isLoading={isLoading}
            isError={isError}
            onChange={(locationId) => onChange({ locationId })}
          />
          <LiveToggle value={filters.live} onChange={(live) => onChange({ live })} />
        </>
      }
    />
  );
}
