import { ButtonLink } from '../../shared/ui/Button';
import { BagIcon, ReceiptIcon, StarIcon, WalletIcon } from '../../shared/ui/icons';
import { useDashboardFilters } from '../filters/useDashboardFilters';
import { DashboardHeader } from './components/DashboardHeader';
import { WidgetPlaceholder } from './components/WidgetPlaceholder';

export function DashboardPage() {
  const [filters, updateFilters] = useDashboardFilters();
  const ordersLink = filters.locationId ? `/orders?location_id=${filters.locationId}` : '/orders';

  return (
    <>
      <DashboardHeader filters={filters} onChange={updateFilters} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            <WidgetPlaceholder title="Выручка" icon={<WalletIcon />} />
            <WidgetPlaceholder title="Заказы" icon={<BagIcon />} />
            <WidgetPlaceholder title="Средний чек" icon={<ReceiptIcon />} />
            <WidgetPlaceholder title="Лучшая позиция" icon={<StarIcon />} />
          </div>
          <WidgetPlaceholder title="Выручка по дням" bodyClassName="h-72" />
          <div className="grid gap-5 lg:grid-cols-2">
            <WidgetPlaceholder title="Топ-10 позиций" bodyClassName="h-64" />
            <WidgetPlaceholder title="Доли категорий" bodyClassName="h-64" />
          </div>
          <WidgetPlaceholder title="Загрузка по часам" bodyClassName="h-64" />
        </div>

        <aside className="flex flex-col gap-5">
          <WidgetPlaceholder title="Последние заказы" bodyClassName="h-96" />
          <ButtonLink to={ordersLink} variant="secondary" className="w-full">
            Все заказы →
          </ButtonLink>
        </aside>
      </div>
    </>
  );
}
