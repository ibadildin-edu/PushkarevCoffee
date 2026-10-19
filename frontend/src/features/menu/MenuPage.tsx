import { useSearchParams } from 'react-router';

import { formatNumber, pluralize } from '../../shared/lib/format';
import { parsePositiveInt, withParams } from '../../shared/lib/searchParams';
import { PageHeader } from '../../shared/layout/PageHeader';
import { Card } from '../../shared/ui/Card';
import { Skeleton } from '../../shared/ui/Skeleton';
import { EmptyState, ErrorState } from '../../shared/ui/States';
import { useGetCategoriesQuery, useGetProductsQuery } from './api';
import { CategoryTabs } from './components/CategoryTabs';
import { ProductsTable } from './components/ProductsTable';

export function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = parsePositiveInt(searchParams.get('category'));
  const showHidden = searchParams.get('hidden') === '1';

  const categories = useGetCategoriesQuery();
  const products = useGetProductsQuery({
    category_id: categoryId,
    is_active: showHidden ? undefined : true,
  });

  const count = products.data?.length;

  return (
    <>
      <PageHeader
        title="Меню"
        subtitle={
          count === undefined ? (
            products.isError ? (
              'Позиции всех категорий'
            ) : (
              <Skeleton className="mt-1 h-4 w-28" />
            )
          ) : (
            `${formatNumber(count)} ${pluralize(count, ['позиция', 'позиции', 'позиций'])}`
          )
        }
        actions={
          <label className="flex h-10 cursor-pointer items-center gap-2.5 text-sm font-medium text-ink-soft select-none">
            <input
              type="checkbox"
              className="size-4 accent-accent"
              checked={showHidden}
              onChange={(event) =>
                setSearchParams(
                  withParams(searchParams, { hidden: event.target.checked ? 1 : undefined }),
                )
              }
            />
            Показывать скрытые
          </label>
        }
      />

      {!categories.isError && (
        <div className="mb-5">
          <CategoryTabs
            categories={categories.data}
            isLoading={categories.isLoading}
            value={categoryId}
            onChange={(id) => setSearchParams(withParams(searchParams, { category: id }))}
          />
        </div>
      )}

      <Card>
        {products.isError ? (
          <ErrorState error={products.error} onRetry={products.refetch} />
        ) : count === 0 ? (
          <EmptyState
            title="Позиций нет"
            description="В этой категории пока ничего нет или все позиции скрыты."
          />
        ) : (
          <ProductsTable
            products={products.data}
            isLoading={products.isLoading}
            isRefreshing={products.isFetching && !products.isLoading}
          />
        )}
      </Card>
    </>
  );
}
