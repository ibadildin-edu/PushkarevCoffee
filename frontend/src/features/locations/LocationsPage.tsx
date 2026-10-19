import { PageHeader } from '../../shared/layout/PageHeader';
import { Card } from '../../shared/ui/Card';
import { LoadingRegion } from '../../shared/ui/Skeleton';
import { EmptyState, ErrorState } from '../../shared/ui/States';
import { useGetLocationsQuery } from './api';
import { LocationCard, LocationCardSkeleton } from './components/LocationCard';

export function LocationsPage() {
  const { data: locations, error, isLoading, isError, refetch } = useGetLocationsQuery();

  return (
    <>
      <PageHeader title="Точки" subtitle="Кофейни сети и их показатели за последние 30 дней" />

      {isLoading ? (
        <LoadingRegion label="Загрузка точек…">
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <LocationCardSkeleton key={index} />
            ))}
          </div>
        </LoadingRegion>
      ) : isError ? (
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      ) : locations?.length === 0 ? (
        <Card>
          <EmptyState
            title="Точек пока нет"
            description="Заполните базу командой uv run python -m app.seed."
          />
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {locations?.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      )}
    </>
  );
}
