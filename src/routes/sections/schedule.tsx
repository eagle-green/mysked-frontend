import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

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
const FieldLevelRiskAssessmentPage = lazy(() => import('src/pages/schedule/flra/flra-form'));

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
          {
            path: 'list',
            element: <WorkListPage />,
          },
          {
            path: 'timesheet',
            children: [
              { path: '', element: <TimesheetPage /> },
              { path: 'edit/:id', element: <TimesheetEditPage /> },
            ]
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
          // Field Level Risk Assessment Routes
          {
            path: 'field-level-risk-assessment',
            children: [
              { path: 'form', element: <FieldLevelRiskAssessmentPage />},
            ],
          },
        ],
      },
    ],
  },
];
