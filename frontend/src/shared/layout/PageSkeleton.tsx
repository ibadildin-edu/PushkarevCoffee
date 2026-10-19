import { Card } from '../ui/Card';
import { LoadingRegion, Skeleton, SkeletonText } from '../ui/Skeleton';
import { PageHeaderSkeleton } from './PageHeader';

/** Shown while a page chunk is loading on first visit. */
export function PageSkeleton() {
  return (
    <LoadingRegion label="Загрузка страницы…">
      <PageHeaderSkeleton />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index}>
            <Skeleton className="mb-5 h-4 w-24" />
            <Skeleton className="mb-4 h-8 w-36" />
            <SkeletonText lines={2} />
          </Card>
        ))}
      </div>
      <Card className="mt-5">
        <SkeletonText lines={6} />
      </Card>
    </LoadingRegion>
  );
}
