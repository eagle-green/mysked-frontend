import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

// Company pages
const CompanyListPage = lazy(() => import('src/pages/company/company-list'));
const CreateCompanyPage = lazy(() => import('src/pages/company/company-create'));
const EditCompanyPage = lazy(() => import('src/pages/company/company-edit'));

// Site pages  
const SiteListPage = lazy(() => import('src/pages/company/site-list'));
const CreateSitePage = lazy(() => import('src/pages/company/site-create'));
const EditSitePage = lazy(() => import('src/pages/company/site-edit'));

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

export const companyRoutes: RouteObject[] = [
  {
    path: 'companies',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        children: [
          {
            path: 'list',
            element: <CompanyListPage />,
          },
          {
            path: 'create',
            element: <CreateCompanyPage />,
          },
          {
            path: 'edit/:id',
            element: <EditCompanyPage />,
          },
          // Site routes
          {
            path: 'site/list',
            element: <SiteListPage />,
          },
          {
            path: 'site/create',
            element: <CreateSitePage />,
          },
          {
            path: 'site/edit/:id',
            element: <EditSitePage />,
          },
        ],
      },
    ],
  },
];
