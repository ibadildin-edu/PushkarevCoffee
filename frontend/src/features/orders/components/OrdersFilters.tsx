import { ORDER_STATUSES, type OrderStatus } from '../../../api/types';
import { Button } from '../../../shared/ui/Button';
import { Select } from '../../../shared/ui/Select';
import { useGetLocationsQuery } from '../../locations/api';
import { ORDER_STATUS_LABELS } from '../statuses';

export interface OrdersFilterValues {
  status?: OrderStatus;
  locationId?: number;
}

interface OrdersFiltersProps {
  value: OrdersFilterValues;
  onChange: (patch: OrdersFilterValues) => void;
  onReset: () => void;
}

export function OrdersFilters({ value, onChange, onReset }: OrdersFiltersProps) {
  const { data: locations, isError: locationsError } = useGetLocationsQuery();
  const hasFilters = value.status !== undefined || value.locationId !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        aria-label="Точка"
        className="w-48"
        value={value.locationId ?? ''}
        disabled={locationsError}
        onChange={(event) =>
          onChange({
            locationId: event.target.value ? Number(event.target.value) : undefined,
          })
        }
      >
        <option value="">{locationsError ? 'Точки недоступны' : 'Все точки'}</option>
        {locations?.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Статус"
        className="w-44"
        value={value.status ?? ''}
        onChange={(event) =>
          onChange({
            status: ORDER_STATUSES.find((status) => status === event.target.value),
          })
        }
      >
        <option value="">Все статусы</option>
        {ORDER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {ORDER_STATUS_LABELS[status]}
          </option>
        ))}
      </Select>
      {hasFilters && (
        <Button variant="ghost" onClick={onReset}>
          Сбросить
        </Button>
      )}
    </div>
  );
}
