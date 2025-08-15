import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const CalendarPage = lazy(() => import('src/pages/work/calendar/calendar'));
const WorkListPage = lazy(() => import('src/pages/work/job/list'));
const CreateWorkPage = lazy(() => import('src/pages/work/job/create'));
const EditJobPage = lazy(() => import('src/pages/work/job/edit'));
const TimelinePage = lazy(() => import('src/pages/work/timeline/timeline'));
const TimesheetPage = lazy(() => import('src/pages/work/timesheet/list'));

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
        children: [
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'timeline', element: <TimelinePage /> },
          {
            path: 'jobs',
            children: [
              { path: 'list', element: <WorkListPage /> },
              { path: 'create', element: <CreateWorkPage /> },
              { path: 'edit/:id', element: <EditJobPage /> },
            ],
          },
          {
            path: 'timesheets',
            children: [{ path: 'list', element: <TimesheetPage /> }],
          },
        ],
      },
    ],
  },
];
