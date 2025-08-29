import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';
import { RoleBasedGuard } from 'src/auth/guard/role-based-guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const JobListPage = lazy(() => import('src/pages/work/job/list'));
const MultiCreateJobPage = lazy(() => import('src/pages/work/job/create'));
const EditJobPage = lazy(() => import('src/pages/work/job/edit'));
const OpenJobListPage = lazy(() => import('src/pages/work/open-job/list'));
const CreateOpenJobPage = lazy(() => import('src/pages/work/open-job/create'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

function dashboardLayout() {
  return (
    <DashboardLayout>
      <SuspenseOutlet />
    </DashboardLayout>
  );
}

export const workRoutes: RouteObject[] = [
  {
    path: 'works',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        path: 'jobs',
        element: (
          <RoleBasedGuard allowedRoles="admin">
            <SuspenseOutlet />
          </RoleBasedGuard>
        ),
        children: [
          {
            path: 'list',
            element: <JobListPage />,
          },
          {
            path: 'create',
            element: <MultiCreateJobPage />,
          },
          {
            path: 'edit/:id',
            element: <EditJobPage />,
          },
        ],
      },
      {
        path: 'open-jobs',
        element: (
          <RoleBasedGuard allowedRoles="admin">
            <SuspenseOutlet />
          </RoleBasedGuard>
        ),
        children: [
          {
            path: 'list',
            element: <OpenJobListPage />,
          },
          {
            path: 'create',
            element: <CreateOpenJobPage />,
          },
        ],
      },
    ],
  },
];
