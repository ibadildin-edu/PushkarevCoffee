import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ORDER_STATUSES } from '../../../api/types';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Field, Input } from '../../../shared/ui/Field';
import { Select } from '../../../shared/ui/Select';
import { useGetLocationsQuery } from '../../locations/api';
import { useGetProductsQuery } from '../../menu/api';
import { ORDER_STATUS_LABELS } from '../statuses';
import type { OrdersFilterValues } from '../urlFilters';

const amount = z.string().trim().regex(/^\d*$/, 'Целое число в тенге');

const filtersSchema = z
  .object({
    dateFrom: z.string(),
    dateTo: z.string(),
    locationId: z.string(),
    status: z.enum(['', ...ORDER_STATUSES]),
    productId: z.string(),
    minTotal: amount,
    maxTotal: amount,
  })
  .refine((v) => !v.dateFrom || !v.dateTo || v.dateFrom <= v.dateTo, {
    path: ['dateTo'],
    message: 'Конец периода раньше начала',
  })
  .refine((v) => !v.minTotal || !v.maxTotal || Number(v.minTotal) <= Number(v.maxTotal), {
    path: ['maxTotal'],
    message: '«До» меньше, чем «от»',
  });

type FiltersForm = z.infer<typeof filtersSchema>;

function toForm(filters: OrdersFilterValues): FiltersForm {
  return {
    dateFrom: filters.dateFrom ?? '',
    dateTo: filters.dateTo ?? '',
    locationId: filters.locationId?.toString() ?? '',
    status: filters.status ?? '',
    productId: filters.productId?.toString() ?? '',
    minTotal: filters.minTotal?.toString() ?? '',
    maxTotal: filters.maxTotal?.toString() ?? '',
  };
}

function fromForm(values: FiltersForm): OrdersFilterValues {
  const optionalNumber = (value: string) => (value ? Number(value) : undefined);
  return {
    dateFrom: values.dateFrom || undefined,
    dateTo: values.dateTo || undefined,
    locationId: optionalNumber(values.locationId),
    status: values.status || undefined,
    productId: optionalNumber(values.productId),
    minTotal: optionalNumber(values.minTotal),
    maxTotal: optionalNumber(values.maxTotal),
  };
}

interface OrdersFiltersProps {
  value: OrdersFilterValues;
  onApply: (filters: OrdersFilterValues) => void;
  onReset: () => void;
  canReset: boolean;
}

export function OrdersFilters({ value, onApply, onReset, canReset }: OrdersFiltersProps) {
  const locations = useGetLocationsQuery();
  const products = useGetProductsQuery({});
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FiltersForm>({ resolver: zodResolver(filtersSchema), defaultValues: toForm(value) });

  // Back/forward navigation and «Сбросить» change the URL: mirror it into the form.
  const serialized = JSON.stringify(value);
  useEffect(() => {
    reset(toForm(JSON.parse(serialized) as OrdersFilterValues));
  }, [serialized, reset]);

  const describedBy = (name: keyof FiltersForm) =>
    errors[name] ? `orders-${name}-error` : undefined;

  return (
    <Card className="mb-5">
      <form
        noValidate
        onSubmit={handleSubmit((values) => onApply(fromForm(values)))}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-[repeat(7,minmax(0,1fr))_auto]"
        aria-label="Фильтры заказов"
      >
        <Field label="С даты" htmlFor="orders-dateFrom">
          <Input id="orders-dateFrom" type="date" {...register('dateFrom')} />
        </Field>
        <Field label="По дату" htmlFor="orders-dateTo" error={errors.dateTo?.message}>
          <Input
            id="orders-dateTo"
            type="date"
            aria-invalid={Boolean(errors.dateTo)}
            aria-describedby={describedBy('dateTo')}
            {...register('dateTo')}
          />
        </Field>
        <Field label="Точка" htmlFor="orders-locationId">
          <Select
            id="orders-locationId"
            className="[&_select]:h-11"
            disabled={locations.isError}
            {...register('locationId')}
          >
            <option value="">Все точки</option>
            {locations.data?.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Статус" htmlFor="orders-status">
          <Select id="orders-status" className="[&_select]:h-11" {...register('status')}>
            <option value="">Все статусы</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Позиция в заказе" htmlFor="orders-productId">
          <Select
            id="orders-productId"
            className="[&_select]:h-11"
            disabled={products.isError}
            {...register('productId')}
          >
            <option value="">Любая</option>
            {products.data?.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
                {product.is_active ? '' : ' (скрыта)'}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Сумма от, ₸" htmlFor="orders-minTotal" error={errors.minTotal?.message}>
          <Input
            id="orders-minTotal"
            inputMode="numeric"
            placeholder="0"
            aria-invalid={Boolean(errors.minTotal)}
            aria-describedby={describedBy('minTotal')}
            {...register('minTotal')}
          />
        </Field>
        <Field label="Сумма до, ₸" htmlFor="orders-maxTotal" error={errors.maxTotal?.message}>
          <Input
            id="orders-maxTotal"
            inputMode="numeric"
            placeholder="∞"
            aria-invalid={Boolean(errors.maxTotal)}
            aria-describedby={describedBy('maxTotal')}
            {...register('maxTotal')}
          />
        </Field>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <Button type="submit" className="flex-1 2xl:flex-none" disabled={!isDirty}>
            Применить
          </Button>
          {canReset && (
            <Button variant="ghost" onClick={onReset}>
              Сбросить
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
