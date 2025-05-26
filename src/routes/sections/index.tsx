import type { RouteObject } from 'react-router';

import { lazy } from 'react';
import { Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';

import { authRoutes } from './auth';
import { siteRoutes } from './site';
import { contactRoutes } from './contact';
import { jobRoutes } from './job-management';
import { dashboardRoutes } from './dashboard';

// ----------------------------------------------------------------------

const Page404 = lazy(() => import('src/pages/error/404'));

export const routesSection: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to={CONFIG.auth.redirectPath} replace />,
  },

  // Auth
  ...authRoutes,

  // Dashboard
  ...dashboardRoutes,

  // Contact
  ...contactRoutes,

  // Job
  ...jobRoutes,

  // Site
  ...siteRoutes,

  // No match
  { path: '*', element: <Page404 /> },
];
