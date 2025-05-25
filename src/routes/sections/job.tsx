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
const CalendarPage = lazy(() => import('src/pages/job-schedule/calendar/calendar'));
const JobListPage = lazy(() => import('src/pages/job-schedule/job/list'));
const CreateJobPage = lazy(() => import('src/pages/job-schedule/job/create'));

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

export const jobRoutes: RouteObject[] = [
  {
    path: 'job-schedule',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        children: [
          { path: 'calendar', element: <CalendarPage /> },
          {
            path: 'jobs',
            index: false,
            children: [
              { path: 'list', element: <JobListPage /> },
              { path: 'create', element: <CreateJobPage /> },
            ],
          },
        ],
      },
    ],
  },
];
