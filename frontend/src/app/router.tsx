import type { ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';

import { AppLayout } from '../shared/layout/AppLayout';
import { NotFoundPage } from '../shared/layout/NotFoundPage';
import { PageSkeleton } from '../shared/layout/PageSkeleton';
import { RouteErrorPage } from '../shared/layout/RouteErrorPage';

/** Code-split page: the skeleton is shown while its chunk loads on the first visit. */
function lazyPage(
  load: () => Promise<ComponentType>,
): Pick<RouteObject, 'lazy' | 'hydrateFallbackElement'> {
  return {
    lazy: async () => ({ Component: await load() }),
    hydrateFallbackElement: <PageSkeleton />,
  };
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        // Pathless route: page errors render inside the layout, the sidebar stays usable.
        errorElement: <RouteErrorPage />,
        children: [
          {
            index: true,
            ...lazyPage(() =>
              import('../features/dashboard/DashboardPage').then((m) => m.DashboardPage),
            ),
          },
          {
            path: 'orders',
            ...lazyPage(() => import('../features/orders/OrdersPage').then((m) => m.OrdersPage)),
          },
          {
            path: 'orders/:id',
            ...lazyPage(() =>
              import('../features/orders/OrderDetailsPage').then((m) => m.OrderDetailsPage),
            ),
          },
          {
            path: 'menu',
            ...lazyPage(() => import('../features/menu/MenuPage').then((m) => m.MenuPage)),
          },
          {
            path: 'locations',
            ...lazyPage(() =>
              import('../features/locations/LocationsPage').then((m) => m.LocationsPage),
            ),
          },
          {
            path: 'locations/:id',
            ...lazyPage(() =>
              import('../features/locations/LocationPage').then((m) => m.LocationPage),
            ),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
