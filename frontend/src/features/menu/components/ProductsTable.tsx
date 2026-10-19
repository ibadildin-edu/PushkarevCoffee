import type { Product } from '../../../api/types';
import { cn } from '../../../shared/lib/cn';
import { formatMoney } from '../../../shared/lib/format';
import { Badge } from '../../../shared/ui/Badge';
import { Table, TableSkeletonRows, Td, Th } from '../../../shared/ui/Table';

interface ProductsTableProps {
  products: Product[] | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
}

export function ProductsTable({ products, isLoading, isRefreshing }: ProductsTableProps) {
  return (
    <Table aria-busy={isLoading || isRefreshing}>
      <thead>
        <tr>
          <Th>Позиция</Th>
          <Th>Категория</Th>
          <Th className="text-right">Цена</Th>
          <Th>Статус</Th>
        </tr>
      </thead>
      <tbody className={cn('transition-opacity', isRefreshing && 'opacity-50')}>
        {isLoading ? (
          <TableSkeletonRows columns={4} rows={10} />
        ) : (
          products?.map((product) => (
            <tr key={product.id} className={cn(!product.is_active && 'text-muted')}>
              <Td className={cn('font-medium', !product.is_active && 'text-muted')}>
                {product.name}
              </Td>
              <Td>
                <span className="inline-flex items-center gap-2 text-ink-soft">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: product.category.color }}
                    aria-hidden="true"
                  />
                  {product.category.name}
                </span>
              </Td>
              <Td className="text-right font-semibold whitespace-nowrap tabular-nums">
                {formatMoney(product.price)}
              </Td>
              <Td>
                {product.is_active ? (
                  <Badge tone="success">В продаже</Badge>
                ) : (
                  <Badge>Скрыта</Badge>
                )}
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
