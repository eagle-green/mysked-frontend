import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';
import { RoleBasedGuard } from 'src/auth/guard/role-based-guard';
import { InvoiceAccessGuard } from 'src/auth/guard/invoice-access-guard';
import { VehicleAccessGuard } from 'src/auth/guard/vehicle-access-guard';

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

// Vehicle pages
const VehicleDashboardPage = lazy(() => import('src/pages/management/vehicle/dashboard'));
const VehicleListPage = lazy(() => import('src/pages/management/vehicle/list'));
const CreateVehiclePage = lazy(() => import('src/pages/management/vehicle/create'));
const EditVehiclePage = lazy(() => import('src/pages/management/vehicle/edit'));
const VehicleAuditPage = lazy(() => import('src/pages/management/vehicle/vehicle-audit-page'));
const VehicleUserAccessListPage = lazy(() => import('src/pages/management/vehicle/user-access/list'));
const VehicleUserAccessEditPage = lazy(() => import('src/pages/management/vehicle/user-access/edit'));

// Inventory pages
const InventoryListPage = lazy(() => import('src/pages/management/inventory/list'));
const CreateInventoryPage = lazy(() => import('src/pages/management/inventory/create'));
const InventoryDetailPage = lazy(() => import('src/pages/management/inventory/detail'));
const EditInventoryPage = lazy(() => import('src/pages/management/inventory/edit'));

// Timesheet page
const TimesheetPage = lazy(() => import('src/pages/management/timesheet/list'));

// Time-off page
const TimeOffListPage = lazy(() => import('src/pages/management/time-off/list'));

// Invoice pages
const InvoiceListPage = lazy(() => import('src/pages/management/invoice/list'));
const InvoiceGeneratePage = lazy(() => import('src/pages/management/invoice/generate'));
const InvoiceCreatePage = lazy(() => import('src/pages/management/invoice/new'));
const InvoiceEditPage = lazy(() => import('src/pages/management/invoice/edit'));
const InvoiceDetailPage = lazy(() => import('src/pages/management/invoice/detail'));
const QboStatusPage = lazy(() => import('src/pages/management/invoice/qbo-status'));
const ServiceListPage = lazy(() => import('src/pages/management/invoice/services/list'));
const CustomerListPage = lazy(() => import('src/pages/management/invoice/customers/list'));
const CustomerDetailPage = lazy(() => import('src/pages/management/invoice/customers/detail'));
const UserAccessListPage = lazy(() => import('src/pages/management/invoice/user-access/list'));
const UserAccessEditPage = lazy(() => import('src/pages/management/invoice/user-access/edit'));

// Updates page
const UpdatesPage = lazy(() => import('src/pages/management/updates/list'));
const UpdateCreatePage = lazy(() => import('src/pages/management/updates/create'));
const UpdateEditPage = lazy(() => import('src/pages/management/updates/edit'));
const UpdateDetailsPage = lazy(() => import('src/pages/management/updates/details'));

// Admin Guide
const AdminGuidePage = lazy(() => import('src/pages/work/guide'));

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
          { path: 'guide', element: <AdminGuidePage /> },
          // Company routes
          {
            path: 'customers',
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
          // Vehicles routes - admin or workers with vehicle_access
          {
            path: 'vehicles',
            children: [
              {
                index: true,
                element: <Navigate to="/management/vehicles/list" replace />,
              },
              {
                path: 'dashboard',
                element: (
                  <VehicleAccessGuard>
                    <VehicleDashboardPage />
                  </VehicleAccessGuard>
                ),
              },
              {
                path: 'list',
                element: (
                  <VehicleAccessGuard>
                    <VehicleListPage />
                  </VehicleAccessGuard>
                ),
              },
              {
                path: 'create',
                element: (
                  <VehicleAccessGuard>
                    <CreateVehiclePage />
                  </VehicleAccessGuard>
                ),
              },
              {
                path: 'edit/:id',
                element: (
                  <VehicleAccessGuard>
                    <EditVehiclePage />
                  </VehicleAccessGuard>
                ),
              },
              {
                path: 'audit',
                element: (
                  <RoleBasedGuard allowedRoles={['admin', 'field_supervisor']}>
                    <VehicleAuditPage />
                  </RoleBasedGuard>
                ),
              },
              {
                path: 'user-access',
                children: [
                  {
                    path: 'list',
                    element: (
                      <RoleBasedGuard allowedRoles="admin">
                        <VehicleUserAccessListPage />
                      </RoleBasedGuard>
                    ),
                  },
                  {
                    path: 'edit/:id',
                    element: (
                      <RoleBasedGuard allowedRoles="admin">
                        <VehicleUserAccessEditPage />
                      </RoleBasedGuard>
                    ),
                  },
                ],
              },
            ],
          },
          // Inventory routes
            {
              path: 'inventory',
              children: [
                { path: 'list', element: <InventoryListPage /> },
                { path: 'create', element: <CreateInventoryPage /> },
                { path: 'detail/:id', element: <InventoryDetailPage /> },
                { path: 'edit/:id', element: <EditInventoryPage /> },
              ],
            },
          // Timesheet
          {
            path: 'timesheets',
            children: [{ path: 'list', element: <TimesheetPage /> }],
          },
          // Time-off routes
          {
            path: 'time-off',
            children: [{ path: 'list', element: <TimeOffListPage /> }],
          },
           // Invoice routes - protected with InvoiceAccessGuard
            {
              path: 'invoice',
              element: <InvoiceAccessGuard><Outlet /></InvoiceAccessGuard>,
              children: [
                { path: 'list', element: <InvoiceListPage /> },
                { path: 'generate', element: <InvoiceGeneratePage /> },
                { path: 'new', element: <InvoiceCreatePage /> },
                { path: 'edit/:id', element: <InvoiceEditPage /> },
                { path: 'qbo-status', element: <QboStatusPage /> },
                {
                  path: 'services',
                  children: [{ path: 'list', element: <ServiceListPage /> }],
                },
                {
                  path: 'customers',
                  children: [
                    { path: 'list', element: <CustomerListPage /> },
                    { path: ':id', element: <CustomerDetailPage /> },
                  ],
                },
                {
                  path: 'user-access',
                  children: [
                    { path: 'list', element: <UserAccessListPage /> },
                    { path: 'edit/:id', element: <UserAccessEditPage /> },
                  ],
                },
                { path: ':id', element: <InvoiceDetailPage /> }, // Must be last to avoid matching other routes
              ],
            },
          // Updates routes
          {
            path: 'updates',
            children: [
              { path: 'list', element: <UpdatesPage /> },
              { path: 'create', element: <UpdateCreatePage /> },
              { path: 'edit/:id', element: <UpdateEditPage /> },
              { path: ':id', element: <UpdateDetailsPage /> },
            ],
          },
        ],
      },
    ],
  },
];
