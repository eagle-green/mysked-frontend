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
const SiteListPage = lazy(() => import('src/pages/site/list'));
const CreateSitePage = lazy(() => import('src/pages/site/create'));
const EditSitePage = lazy(() => import('src/pages/site/edit'));

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

export const siteRoutes: RouteObject[] = [
  {
    path: 'site',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        children: [
          {
            path: 'list',
            element: <SiteListPage />,
          },
          {
            path: 'create',
            element: <CreateSitePage />,
          },
          {
            path: 'edit/:id',
            element: <EditSitePage />,
          },
        ],
      },
    ],
  },
];
