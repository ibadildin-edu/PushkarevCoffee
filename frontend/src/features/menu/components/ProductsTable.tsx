import type { Product } from '../../../api/types';
import { cn } from '../../../shared/lib/cn';
import { formatMoney } from '../../../shared/lib/format';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { Table, TableSkeletonRows, Td, Th } from '../../../shared/ui/Table';

interface ProductsTableProps {
  products: Product[] | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  /** Product id with a hide/restore request in flight. */
  pendingId: number | null;
  onEdit: (product: Product) => void;
  onToggleActive: (product: Product) => void;
}

export function ProductsTable({
  products,
  isLoading,
  isRefreshing,
  pendingId,
  onEdit,
  onToggleActive,
}: ProductsTableProps) {
  return (
    <Table aria-busy={isLoading || isRefreshing}>
      <thead>
        <tr>
          <Th>Позиция</Th>
          <Th>Категория</Th>
          <Th className="text-right">Цена</Th>
          <Th>Статус</Th>
          <Th className="text-right">
            <span className="sr-only">Действия</span>
          </Th>
        </tr>
      </thead>
      <tbody className={cn('transition-opacity', isRefreshing && 'opacity-50')}>
        {isLoading ? (
          <TableSkeletonRows columns={5} rows={10} />
        ) : (
          products?.map((product) => (
            <tr key={product.id}>
              <Td className={cn('font-medium', !product.is_active && 'text-muted')}>
                {product.name}
              </Td>
              <Td>
                <span className="inline-flex items-center gap-2 text-ink-soft">
                  {/* Category colour is data from the API. */}
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: product.category.color }}
                    aria-hidden="true"
                  />
                  {product.category.name}
                </span>
              </Td>
              <Td
                className={cn(
                  'text-right font-semibold whitespace-nowrap tabular-nums',
                  !product.is_active && 'text-muted',
                )}
              >
                {formatMoney(product.price)}
              </Td>
              <Td>
                {product.is_active ? (
                  <Badge tone="success">В продаже</Badge>
                ) : (
                  <Badge>Скрыта</Badge>
                )}
              </Td>
              <Td className="text-right whitespace-nowrap">
                <Button variant="ghost" className="h-9 px-3" onClick={() => onEdit(product)}>
                  Изменить
                </Button>
                <Button
                  variant="ghost"
                  className="h-9 px-3"
                  disabled={pendingId === product.id}
                  onClick={() => onToggleActive(product)}
                >
                  {product.is_active ? 'Скрыть' : 'Вернуть'}
                </Button>
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
