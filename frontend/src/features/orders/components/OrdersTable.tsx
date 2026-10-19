import { Link, useNavigate } from 'react-router';

import type { OrderListItem, OrderSort } from '../../../api/types';
import { cn } from '../../../shared/lib/cn';
import { formatDateTime, formatMoney, formatNumber } from '../../../shared/lib/format';
import { Badge } from '../../../shared/ui/Badge';
import { Table, TableSkeletonRows, Td, Th } from '../../../shared/ui/Table';
import { OrderStatusBadge } from './OrderStatusBadge';

type SortField = 'number' | 'created_at' | 'total_amount';

interface SortableThProps {
  field: SortField;
  sort: OrderSort | undefined;
  onSortChange: ((sort: OrderSort) => void) | undefined;
  className?: string;
  children: string;
}

/** Click: descending first, then ascending. Plain header when sorting is not wired. */
function SortableTh({ field, sort, onSortChange, className, children }: SortableThProps) {
  if (!onSortChange) return <Th className={className}>{children}</Th>;
  const direction = sort === field ? 'ascending' : sort === `-${field}` ? 'descending' : 'none';
  const next: OrderSort = direction === 'descending' ? field : `-${field}`;
  return (
    <Th className={className} aria-sort={direction}>
      <button
        type="button"
        onClick={() => onSortChange(next)}
        className={cn(
          'inline-flex items-center gap-1 uppercase hover:text-ink',
          direction !== 'none' && 'text-ink',
        )}
      >
        {children}
        <span aria-hidden="true" className="w-3">
          {direction === 'ascending' ? '↑' : direction === 'descending' ? '↓' : ''}
        </span>
      </button>
    </Th>
  );
}

interface OrdersTableProps {
  orders: OrderListItem[] | undefined;
  isLoading: boolean;
  /** Dims rows while a new page is loading over the old one. */
  isRefreshing?: boolean;
  showLocation?: boolean;
  skeletonRows?: number;
  sort?: OrderSort;
  onSortChange?: (sort: OrderSort) => void;
}

export function OrdersTable({
  orders,
  isLoading,
  isRefreshing,
  showLocation = true,
  skeletonRows,
  sort,
  onSortChange,
}: OrdersTableProps) {
  const sortProps = { sort, onSortChange };
  const navigate = useNavigate();
  const columns = showLocation ? 6 : 5;

  return (
    <Table aria-busy={isLoading || isRefreshing}>
      <thead>
        <tr>
          <SortableTh field="number" {...sortProps}>
            Заказ
          </SortableTh>
          <SortableTh field="created_at" {...sortProps}>
            Время
          </SortableTh>
          {showLocation && <Th>Точка</Th>}
          <Th className="text-right">Позиций</Th>
          <SortableTh field="total_amount" className="text-right" {...sortProps}>
            Сумма
          </SortableTh>
          <Th>Статус</Th>
        </tr>
      </thead>
      <tbody className={cn('transition-opacity', isRefreshing && 'opacity-50')}>
        {isLoading ? (
          <TableSkeletonRows columns={columns} rows={skeletonRows} />
        ) : (
          orders?.map((order) => (
            <tr
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="cursor-pointer transition-colors hover:bg-surface-muted/60"
            >
              <Td className="font-semibold">
                <Link
                  to={`/orders/${order.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="hover:text-accent"
                >
                  #{order.number}
                </Link>
              </Td>
              <Td className="whitespace-nowrap text-ink-soft">
                {formatDateTime(order.created_at)}
              </Td>
              {showLocation && (
                <Td>
                  <Badge>{order.location_name}</Badge>
                </Td>
              )}
              <Td className="text-right tabular-nums">{formatNumber(order.items_count)}</Td>
              <Td className="text-right font-semibold whitespace-nowrap tabular-nums">
                {formatMoney(order.total_amount)}
              </Td>
              <Td>
                <OrderStatusBadge status={order.status} />
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
