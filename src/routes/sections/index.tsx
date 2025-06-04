import type { RouteObject } from 'react-router';

import { lazy } from 'react';
import { Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';

import { RoleBasedGuard } from 'src/auth/guard/role-based-guard';

import { authRoutes } from './auth';
import { siteRoutes } from './site';
import { contactRoutes } from './contact';
import { resourceRoutes } from './resource';
import { scheduleRoutes } from './schedule';
import { dashboardRoutes } from './dashboard';
import { workRoutes } from './work-management';

// ----------------------------------------------------------------------

const Page404 = lazy(() => import('src/pages/error/404'));

// Wrap routes with role-based protection
const protectedWorkRoutes = workRoutes.map((route) => ({
  ...route,
  element: (
    <RoleBasedGuard allowedRoles="admin">
      {route.element}
    </RoleBasedGuard>
  ),
}));

const protectedContactRoutes = contactRoutes.map((route) => ({
  ...route,
  element: (
    <RoleBasedGuard allowedRoles="admin">
      {route.element}
    </RoleBasedGuard>
  ),
}));

const protectedSiteRoutes = siteRoutes.map((route) => ({
  ...route,
  element: (
    <RoleBasedGuard allowedRoles="admin">
      {route.element}
    </RoleBasedGuard>
  ),
}));

const protectedResourceRoutes = resourceRoutes.map((route) => ({
  ...route,
  element: (
    <RoleBasedGuard allowedRoles="admin">
      {route.element}
    </RoleBasedGuard>
  ),
}));

export const routesSection: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to={CONFIG.auth.redirectPath} replace />,
  },

  // Auth
  ...authRoutes,

  // Dashboard
  ...dashboardRoutes,

  // Schedule
  ...scheduleRoutes,

  // Contact (Protected)
  ...protectedContactRoutes,

  // Work (Protected)
  ...protectedWorkRoutes,

  // Site (Protected)
  ...protectedSiteRoutes,

  // Resource (Protected)
  ...protectedResourceRoutes,

  // No match
  { path: '*', element: <Page404 /> },
];
