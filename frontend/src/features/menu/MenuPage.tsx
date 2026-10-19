import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import type { Product } from '../../api/types';
import { getErrorMessage, type ApiError } from '../../shared/lib/apiError';
import { formatNumber, pluralize } from '../../shared/lib/format';
import { parsePositiveInt, withParams } from '../../shared/lib/searchParams';
import { useDebouncedValue } from '../../shared/lib/useDebouncedValue';
import { PageHeader } from '../../shared/layout/PageHeader';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Input } from '../../shared/ui/Field';
import { Skeleton } from '../../shared/ui/Skeleton';
import { EmptyState, ErrorState } from '../../shared/ui/States';
import {
  useDeactivateProductMutation,
  useGetCategoriesQuery,
  useGetProductsQuery,
  useUpdateProductMutation,
} from './api';
import { CategoryTabs } from './components/CategoryTabs';
import { ProductFormDialog } from './components/ProductFormDialog';
import { ProductsTable } from './components/ProductsTable';

type DialogState = { open: false } | { open: true; product: Product | null };

export function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = parsePositiveInt(searchParams.get('category'));
  const showHidden = searchParams.get('hidden') === '1';
  const urlSearch = searchParams.get('q') ?? '';

  // The input updates instantly; the URL (and the request) follows after a pause.
  const [search, setSearch] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(search.trim());
  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      setSearchParams((prev) => withParams(prev, { q: debouncedSearch }), { replace: true });
    }
  }, [debouncedSearch, urlSearch, setSearchParams]);

  const categories = useGetCategoriesQuery();
  const products = useGetProductsQuery({
    category_id: categoryId,
    is_active: showHidden ? undefined : true,
    search: urlSearch || undefined,
  });
  const [deactivate, deactivateState] = useDeactivateProductMutation();
  const [update, updateState] = useUpdateProductMutation();
  const [dialog, setDialog] = useState<DialogState>({ open: false });

  const pendingId = deactivateState.isLoading
    ? (deactivateState.originalArgs ?? null)
    : updateState.isLoading
      ? (updateState.originalArgs?.id ?? null)
      : null;
  const toggleError = deactivateState.error ?? updateState.error;

  const toggleActive = (product: Product) => {
    if (product.is_active) void deactivate(product.id);
    else void update({ id: product.id, changes: { is_active: true } });
  };

  const count = products.data?.length;
  const filtered = Boolean(urlSearch || categoryId);

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
          <Button
            onClick={() => setDialog({ open: true, product: null })}
            disabled={!categories.data?.length}
          >
            + Добавить позицию
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {!categories.isError && (
          <CategoryTabs
            categories={categories.data}
            isLoading={categories.isLoading}
            value={categoryId}
            onChange={(id) => setSearchParams(withParams(searchParams, { category: id }))}
          />
        )}
        <div className="flex flex-wrap items-center gap-4">
          <Input
            type="search"
            aria-label="Поиск по названию"
            placeholder="Поиск по названию"
            className="w-64"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium whitespace-nowrap text-ink-soft select-none">
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
        </div>
      </div>

      {toggleError && (
        <p role="alert" className="mb-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          Не удалось изменить позицию: {getErrorMessage(toggleError as ApiError)}
        </p>
      )}

      <Card>
        {products.isError ? (
          <ErrorState error={products.error} onRetry={products.refetch} />
        ) : count === 0 ? (
          <EmptyState
            title="Позиций не найдено"
            description={
              filtered
                ? 'Попробуйте другой запрос или категорию.'
                : 'В меню пока ничего нет — добавьте первую позицию.'
            }
          />
        ) : (
          <ProductsTable
            products={products.data}
            isLoading={products.isLoading}
            isRefreshing={products.isFetching && !products.isLoading}
            pendingId={pendingId}
            onEdit={(product) => setDialog({ open: true, product })}
            onToggleActive={toggleActive}
          />
        )}
      </Card>

      <ProductFormDialog
        open={dialog.open}
        product={dialog.open ? dialog.product : null}
        categories={categories.data ?? []}
        onClose={() => setDialog({ open: false })}
      />
    </>
  );
}
