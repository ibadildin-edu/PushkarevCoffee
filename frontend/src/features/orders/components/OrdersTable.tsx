import { Link, useNavigate } from 'react-router';

import type { OrderListItem } from '../../../api/types';
import { cn } from '../../../shared/lib/cn';
import { formatDateTime, formatMoney, formatNumber } from '../../../shared/lib/format';
import { Badge } from '../../../shared/ui/Badge';
import { Table, TableSkeletonRows, Td, Th } from '../../../shared/ui/Table';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrdersTableProps {
  orders: OrderListItem[] | undefined;
  isLoading: boolean;
  /** Dims rows while a new page is loading over the old one. */
  isRefreshing?: boolean;
  showLocation?: boolean;
  skeletonRows?: number;
}

export function OrdersTable({
  orders,
  isLoading,
  isRefreshing,
  showLocation = true,
  skeletonRows,
}: OrdersTableProps) {
  const navigate = useNavigate();
  const columns = showLocation ? 6 : 5;

  return (
    <Table aria-busy={isLoading || isRefreshing}>
      <thead>
        <tr>
          <Th>Заказ</Th>
          <Th>Время</Th>
          {showLocation && <Th>Точка</Th>}
          <Th className="text-right">Позиций</Th>
          <Th className="text-right">Сумма</Th>
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
