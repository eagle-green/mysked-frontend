import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('src/pages/error/404'));
const EmployeePage = lazy(() => import('src/pages/contact/employee/list'));
const CreateEmployeePage = lazy(() => import('src/pages/contact/employee/create'));
const ClientPage = lazy(() => import('src/pages/contact/client/list'));
const CreateClientPage = lazy(() => import('src/pages/contact/client/create'));

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
    path: 'contact',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        children: [
          {
            path: 'employee',
            children: [
              { path: 'list', element: <EmployeePage /> },
              { path: 'create', element: <CreateEmployeePage /> },
            ],
          },
          {
            path: 'client',
            children: [
              { path: 'list', element: <ClientPage /> },
              { path: 'create', element: <CreateClientPage /> },
            ],
          },
        ],
      },
    ],
  },
];
