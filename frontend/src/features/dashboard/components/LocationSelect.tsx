import type { Location } from '../../../api/types';
import { Select } from '../../../shared/ui/Select';
import { Skeleton } from '../../../shared/ui/Skeleton';

interface LocationSelectProps {
  value: number | null;
  locations: Location[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onChange: (locationId: number | null) => void;
}

export function LocationSelect({
  value,
  locations,
  isLoading,
  isError,
  onChange,
}: LocationSelectProps) {
  if (isLoading) return <Skeleton className="h-12 w-56 rounded-2xl" />;

  return (
    <Select
      aria-label="Точка"
      className="w-56"
      value={value ?? ''}
      disabled={isError}
      title={isError ? 'Не удалось загрузить список точек' : undefined}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
    >
      <option value="">{isError ? 'Точки недоступны' : 'Все точки'}</option>
      {locations?.map((location) => (
        <option key={location.id} value={location.id}>
          {location.name}
        </option>
      ))}
    </Select>
  );
}
