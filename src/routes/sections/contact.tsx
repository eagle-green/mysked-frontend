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
const EmployeePage = lazy(() => import('src/pages/contact/employee'));
const ClientPage = lazy(() => import('src/pages/contact/client'));
const CompanyPage = lazy(() => import('src/pages/contact/company'));

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
      { element: <IndexPage />, index: true },
      {
        children: [
          { path: 'employee', element: <EmployeePage /> },
          { path: 'client', element: <ClientPage /> },
          { path: 'company', element: <CompanyPage /> },
        ],
      },
    ],
  },
];
