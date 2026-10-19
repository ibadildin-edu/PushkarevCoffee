import { isRouteErrorResponse, useRouteError } from 'react-router';

import { Button, ButtonLink } from '../ui/Button';
import { Card } from '../ui/Card';
import { AlertIcon } from '../ui/icons';
import { NotFoundPage } from './NotFoundPage';

function describe(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`.trim();
  if (error instanceof Error) {
    // Vite throws this when a lazy page chunk is gone after a redeploy or the dev server stopped.
    if (/dynamically imported module|Importing a module script failed/i.test(error.message)) {
      return 'Не удалось загрузить код страницы. Обновите страницу.';
    }
    return error.message;
  }
  return 'Неизвестная ошибка.';
}

/** errorElement for routes: unexpected render errors and failed page chunk loads. */
export function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  return (
    <Card role="alert" className="mx-auto mt-6 max-w-xl py-12 text-center sm:mt-16">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertIcon width={28} height={28} />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-ink">Что-то пошло не так</h1>
      <p className="mx-auto mt-2 max-w-md text-[15px] break-words text-muted">{describe(error)}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.location.reload()}>Обновить страницу</Button>
        <ButtonLink to="/" variant="secondary">
          На дашборд
        </ButtonLink>
      </div>
    </Card>
  );
}
