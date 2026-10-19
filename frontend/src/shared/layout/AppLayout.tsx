import { Outlet, useNavigation } from 'react-router';

import { Sidebar } from './Sidebar';

function NavigationProgress() {
  const navigation = useNavigation();
  if (navigation.state === 'idle') return null;

  return (
    <div
      role="progressbar"
      aria-label="Загрузка страницы"
      className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-accent-soft"
    >
      <div className="h-full w-2/5 animate-progress bg-accent" />
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen lg:flex">
      <NavigationProgress />
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-9 lg:py-9">
        <div className="mx-auto max-w-[1440px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
