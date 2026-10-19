import { Link, useParams } from 'react-router';

import { formatDateTime, formatMoney, formatNumber, pluralize } from '../../shared/lib/format';
import { parsePositiveInt } from '../../shared/lib/searchParams';
import { PageHeader, PageHeaderSkeleton } from '../../shared/layout/PageHeader';
import { Badge } from '../../shared/ui/Badge';
import { Card, CardHeader } from '../../shared/ui/Card';
import { ArrowLeftIcon } from '../../shared/ui/icons';
import { LoadingRegion } from '../../shared/ui/Skeleton';
import { NotFoundState, QueryErrorState } from '../../shared/ui/States';
import { Table, TableSkeletonRows, Td, Th } from '../../shared/ui/Table';
import { useGetOrderQuery } from './api';
import { OrderStatusBadge } from './components/OrderStatusBadge';

const NOT_FOUND = {
  title: 'Заказ не найден',
  description: 'Возможно, ссылка неверная или заказ был удалён.',
  backTo: '/orders',
  backLabel: 'Ко всем заказам',
};

function BackLink() {
  return (
    <Link
      to="/orders"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
    >
      <ArrowLeftIcon width={16} height={16} />
      Все заказы
    </Link>
  );
}

export function OrderDetailsPage() {
  const params = useParams();
  const orderId = parsePositiveInt(params.id ?? null);
  const {
    data: order,
    error,
    isLoading,
    isError,
    refetch,
  } = useGetOrderQuery(orderId ?? 0, {
    skip: orderId === undefined,
  });

  if (orderId === undefined) {
    return (
      <Card>
        <NotFoundState {...NOT_FOUND} />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <LoadingRegion label="Загрузка заказа…">
        <BackLink />
        <div className="mt-3">
          <PageHeaderSkeleton />
        </div>
        <Card>
          <Table>
            <tbody>
              <TableSkeletonRows columns={4} rows={3} />
            </tbody>
          </Table>
        </Card>
      </LoadingRegion>
    );
  }

  if (isError || !order) {
    return (
      <Card>
        <QueryErrorState error={error} onRetry={refetch} notFound={NOT_FOUND} />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={<BackLink />}
        title={`Заказ #${order.number}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {formatDateTime(order.created_at)}
            <Link to={`/locations/${order.location.id}`}>
              <Badge className="hover:bg-heat-1">{order.location.name}</Badge>
            </Link>
            <OrderStatusBadge status={order.status} />
          </span>
        }
      />
      <Card className="max-w-3xl">
        <CardHeader
          title="Состав заказа"
          subtitle={`${formatNumber(order.items_count)} ${pluralize(order.items_count, ['позиция', 'позиции', 'позиций'])}`}
        />
        <Table className="min-w-[480px]">
          <thead>
            <tr>
              <Th>Позиция</Th>
              <Th className="text-right">Кол-во</Th>
              <Th className="text-right">Цена</Th>
              <Th className="text-right">Сумма</Th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <Td className="font-medium">{item.product_name}</Td>
                <Td className="text-right tabular-nums">×{formatNumber(item.quantity)}</Td>
                <Td className="text-right whitespace-nowrap text-ink-soft tabular-nums">
                  {formatMoney(item.unit_price)}
                </Td>
                <Td className="text-right whitespace-nowrap tabular-nums">
                  {formatMoney(item.line_total)}
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="px-5 pt-4 text-right font-medium text-muted sm:px-6">
                Итого
              </td>
              <td className="px-5 pt-4 text-right text-lg font-bold whitespace-nowrap tabular-nums sm:px-6">
                {formatMoney(order.total_amount)}
              </td>
            </tr>
          </tfoot>
        </Table>
      </Card>
    </>
  );
}
