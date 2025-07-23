import type { RouteObject } from 'react-router';

import { lazy } from 'react';
import { Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';

import { RoleBasedGuard } from 'src/auth/guard/role-based-guard';
import { UserSelfOrAdminGuard } from 'src/auth/guard/user-self-or-admin-guard';

import { authRoutes } from './auth';
import { accountRoutes } from './account';
import { scheduleRoutes } from './schedule';
import { dashboardRoutes } from './dashboard';
import { workRoutes } from './work-management';
import { managementRoutes } from './management';

// ----------------------------------------------------------------------

const Page404 = lazy(() => import('src/pages/error/404'));

const protectedAccountRoutes = accountRoutes.map((route) => ({
  ...route,
  element: <UserSelfOrAdminGuard>{route.element}</UserSelfOrAdminGuard>,
}));

// Wrap routes with role-based protection
const protectedWorkRoutes = workRoutes.map((route) => ({
  ...route,
  element: <RoleBasedGuard allowedRoles="admin">{route.element}</RoleBasedGuard>,
}));

const protectedManagementRoutes = managementRoutes.map((route) => ({
  ...route,
  element: <RoleBasedGuard allowedRoles="admin">{route.element}</RoleBasedGuard>,
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

  // Account (Protected)
  ...protectedAccountRoutes,

  // Work (Protected)
  ...protectedWorkRoutes,

  // Management (Protected) - Companies, Contacts, Resources
  ...protectedManagementRoutes,

  // No match
  { path: '*', element: <Page404 /> },
];
