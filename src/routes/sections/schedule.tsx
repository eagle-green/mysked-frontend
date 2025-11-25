import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const CalendarPage = lazy(() => import('src/pages/schedule/calendar/calendar'));
const WorkListPage = lazy(() => import('src/pages/schedule/work/list'));
const TimesheetPage = lazy(() => import('src/pages/schedule/timesheet/list'));
const TimeOffListPage = lazy(() => import('src/pages/schedule/time-off/list'));
const TimeOffCreatePage = lazy(() => import('src/pages/schedule/time-off/create'));
const TimeOffEditPage = lazy(() => import('src/pages/schedule/time-off/edit'));
const TimesheetEditPage = lazy(() => import('src/pages/schedule/timesheet/edit'));
const FieldLevelRiskAssessmentPage = lazy(() => import('src/pages/schedule/flra-form/flra-form'));
const FlraListPage = lazy(() => import('src/pages/schedule/flra/list'));
const FlraDetailPage = lazy(() => import('src/pages/schedule/flra-form/[id]'));
const FlraPdfPage = lazy(() => import('src/pages/schedule/flra-pdf/[id]'));
const TmpListPage = lazy(() => import('src/pages/schedule/tmp/list'));
const TmpDetailPage = lazy(() => import('src/pages/schedule/tmp/[id]'));
const WorkerGuidePage = lazy(() => import('src/pages/schedule/guide'));
const MyVehiclePage = lazy(() => import('src/pages/schedule/vehicle/vehicle'));

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

export const scheduleRoutes: RouteObject[] = [
  {
    path: 'schedules',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      {
        children: [
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'guide', element: <WorkerGuidePage /> },
          { path: 'vehicle', element: <MyVehiclePage /> },
          // Work routes
          {
            path: 'work',
            children: [
              { path: 'list', element: <WorkListPage /> },
              {
                path: 'jobs',
                children: [{ path: 'list', element: <WorkListPage /> }],
              },

              {
                path: 'timesheets',
                children: [
                  { path: 'list', element: <TimesheetPage /> },
                  { path: 'edit/:id', element: <TimesheetEditPage /> },
                ],
              },
              {
                path: 'flra',
                children: [
                  { path: '', element: <Navigate to="list" replace /> },
                  { path: 'list', element: <FlraListPage /> },
                  { path: 'pdf/:id', element: <FlraPdfPage /> },
                  { path: 'edit/:id', element: <FieldLevelRiskAssessmentPage /> },
                  { path: ':id', element: <FlraDetailPage /> },
                ],
              },
              {
                path: 'tmp',
                children: [
                  { path: '', element: <Navigate to="list" replace /> },
                  { path: 'list', element: <TmpListPage /> },
                  { path: ':id', element: <TmpDetailPage /> },
                ],
              },
            ],
          },
          {
            path: 'timesheet',
            children: [
              { path: '', element: <TimesheetPage /> },
              { path: 'edit/:id', element: <TimesheetEditPage /> },
            ],
          },
          // Time-off routes
          {
            path: 'time-off',
            children: [
              { path: 'list', element: <TimeOffListPage /> },
              { path: 'create', element: <TimeOffCreatePage /> },
              { path: 'edit/:id', element: <TimeOffEditPage /> },
            ],
          },
        ],
      },
    ],
  },
];
