import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const CalendarPage = lazy(() => import('src/pages/work/calendar/calendar'));
const WorkListPage = lazy(() => import('src/pages/work/job/list'));
const CreateWorkPage = lazy(() => import('src/pages/work/job/create'));
const BoardViewPage = lazy(() => import('src/pages/work/job/board-view'));
const EditJobPage = lazy(() => import('src/pages/work/job/edit'));
const TimelinePage = lazy(() => import('src/pages/work/timeline/timeline'));
const TimesheetPage = lazy(() => import('src/pages/work/timesheet/list'));
const TimesheetEditPage = lazy(() => import('src/pages/work/timesheet/edit'));
const OpenJobListPage = lazy(() => import('src/pages/work/open-job/list'));
const CreateOpenJobPage = lazy(() => import('src/pages/work/open-job/create'));
const EditOpenJobPage = lazy(() => import('src/pages/work/open-job/edit'));
const FlraListPage = lazy(() => import('src/pages/work/flra/list'));
const FlraPdfPage = lazy(() => import('src/pages/work/flra/pdf/[id]'));
const TmpListPage = lazy(() => import('src/pages/work/tmp/list'));
const TmpDetailPage = lazy(() => import('src/pages/work/tmp/[id]'));
const MissingTimecardsListPage = lazy(() => import('src/pages/schedule/missing-timecards/list'));

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
          { path: 'board', element: <BoardViewPage /> },
          { path: 'timeline', element: <TimelinePage /> },
          {
            path: 'jobs',
            children: [
              { path: 'list', element: <WorkListPage /> },
              { path: 'create', element: <CreateWorkPage /> },
              { path: 'edit/:id', element: <EditJobPage /> },
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
              {
                path: 'missing-timecards',
                children: [
                  { path: '', element: <Navigate to="list" replace /> },
                  { path: 'list', element: <MissingTimecardsListPage /> },
                ],
              },
            ],
          },
          {
            path: 'open-jobs',
            children: [
              { path: 'list', element: <OpenJobListPage /> },
              { path: 'create', element: <CreateOpenJobPage /> },
              { path: 'edit/:id', element: <EditOpenJobPage /> },
            ],
          },
        ],
      },
    ],
  },
];
