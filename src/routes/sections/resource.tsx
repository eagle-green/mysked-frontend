import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const VehicleListPage = lazy(() => import('src/pages/resource/vehicle/list'));
const CreateVehiclePage = lazy(() => import('src/pages/resource/vehicle/create'));
const EditVehiclePage = lazy(() => import('src/pages/resource/vehicle/edit'));

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

export const resourceRoutes: RouteObject[] = [
  {
    path: 'resources',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        children: [
          {
            path: 'vehicles',
            children: [
              { path: 'list', element: <VehicleListPage /> },
              { path: 'create', element: <CreateVehiclePage /> },
              {
                path: 'edit/:id',
                element: <EditVehiclePage />,
              },
            ],
          },
        ],
      },
    ],
  },
];
