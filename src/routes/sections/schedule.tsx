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
        ],
      },
    ],
  },
];
