import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const EmployeePage = lazy(() => import('src/pages/contact/employee/list'));
const CreateEmployeePage = lazy(() => import('src/pages/contact/employee/create'));
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
            path: 'employees',
            children: [
              { path: 'list', element: <EmployeePage /> },
              { path: 'create', element: <CreateEmployeePage /> },
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
