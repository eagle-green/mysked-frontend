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
const CompanyListPage = lazy(() => import('src/pages/management/company/company-list'));
const CreateCompanyPage = lazy(() => import('src/pages/management/company/company-create'));
const EditCompanyPage = lazy(() => import('src/pages/management/company/company-edit'));

// Site pages
const SiteListPage = lazy(() => import('src/pages/management/company/site-list'));
const CreateSitePage = lazy(() => import('src/pages/management/company/site-create'));
const EditSitePage = lazy(() => import('src/pages/management/company/site-edit'));

// Contact pages - Users
const UserPage = lazy(() => import('src/pages/management/contact/user/list'));
const CreateUserPage = lazy(() => import('src/pages/management/contact/user/create'));
const EditUserPage = lazy(() => import('src/pages/management/contact/user/edit'));

// Contact pages - Clients
const ClientPage = lazy(() => import('src/pages/management/contact/client/list'));
const CreateClientPage = lazy(() => import('src/pages/management/contact/client/create'));
const EditClientPage = lazy(() => import('src/pages/management/contact/client/edit'));

// Resource pages - Vehicles
const VehicleListPage = lazy(() => import('src/pages/management/resource/vehicle/list'));
const CreateVehiclePage = lazy(() => import('src/pages/management/resource/vehicle/create'));
const EditVehiclePage = lazy(() => import('src/pages/management/resource/vehicle/edit'));

// Timesheet page
const TimesheetPage = lazy(() => import('src/pages/management/timesheet/list'));

// Time-off page
const TimeOffListPage = lazy(() => import('src/pages/management/time-off/list'));

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

export const managementRoutes: RouteObject[] = [
  {
    path: 'management',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        children: [
          // Company routes
          {
            path: 'companies',
            children: [
              { path: 'list', element: <CompanyListPage /> },
              { path: 'create', element: <CreateCompanyPage /> },
              { path: 'edit/:id', element: <EditCompanyPage /> },
              {
                path: 'sites',
                children: [
                  { path: 'list', element: <SiteListPage /> },
                  { path: 'create', element: <CreateSitePage /> },
                  { path: 'edit/:id', element: <EditSitePage /> },
                ],
              },
            ],
          },

          // Contact routes - Users
          {
            path: 'users',
            children: [
              { path: 'list', element: <UserPage /> },
              { path: 'create', element: <CreateUserPage /> },
              { path: 'edit/:id', element: <EditUserPage /> },
            ],
          },
          // Contact routes - Clients
          {
            path: 'clients',
            children: [
              { path: 'list', element: <ClientPage /> },
              { path: 'create', element: <CreateClientPage /> },
              { path: 'edit/:id', element: <EditClientPage /> },
            ],
          },
          // Resource routes - Vehicles
          {
            path: 'vehicles',
            children: [
              { path: 'list', element: <VehicleListPage /> },
              { path: 'create', element: <CreateVehiclePage /> },
              { path: 'edit/:id', element: <EditVehiclePage /> },
            ],
          },
          // Resource routes - Vehicles
          {
            path: 'timesheets',
            children: [{ path: 'list', element: <TimesheetPage /> }],
          },
          // Time-off routes
          {
            path: 'time-off',
            children: [{ path: 'list', element: <TimeOffListPage /> }],
          },
        ],
      },
    ],
  },
];
