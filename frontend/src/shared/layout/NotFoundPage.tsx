import { useLocation } from 'react-router';

import { ButtonLink } from '../ui/Button';
import { Card } from '../ui/Card';

export function NotFoundPage() {
  const { pathname } = useLocation();

  return (
    <Card className="mx-auto mt-6 max-w-xl py-14 text-center sm:mt-16">
      <p className="text-7xl font-extrabold tracking-tight text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink">Страница не найдена</h1>
      <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted">
        По адресу{' '}
        <code className="rounded-md bg-surface-muted px-1.5 py-0.5 text-ink-soft">{pathname}</code>{' '}
        ничего нет. Возможно, ссылка устарела или в ней опечатка.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/">На дашборд</ButtonLink>
        <ButtonLink to="/orders" variant="secondary">
          К заказам
        </ButtonLink>
      </div>
    </Card>
  );
}
