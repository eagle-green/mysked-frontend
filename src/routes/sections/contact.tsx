import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const UserPage = lazy(() => import('src/pages/contact/user/list'));
const CreateUserPage = lazy(() => import('src/pages/contact/user/create'));
const EditUserPage = lazy(() => import('src/pages/contact/user/edit'));

const ClientPage = lazy(() => import('src/pages/contact/client/list'));
const CreateClientPage = lazy(() => import('src/pages/contact/client/create'));
const EditClientPage = lazy(() => import('src/pages/contact/client/edit'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

export const contactRoutes: RouteObject[] = [
  {
    path: 'contacts',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        children: [
          {
            path: 'users',
            children: [
              { path: 'list', element: <UserPage /> },
              { path: 'create', element: <CreateUserPage /> },
              {
                path: 'edit/:id',
                element: <EditUserPage />,
              },
            ],
          },
          {
            path: 'clients',
            children: [
              { path: 'list', element: <ClientPage /> },
              { path: 'create', element: <CreateClientPage /> },
              {
                path: 'edit/:id',
                element: <EditClientPage />,
              },
            ],
          },
        ],
      },
    ],
  },
];
