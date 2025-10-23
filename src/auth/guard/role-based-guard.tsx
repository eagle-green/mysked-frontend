import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router';

import { paths } from 'src/routes/paths';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

/**
 * NOTE:
 * This component is for reference only.
 * You can customize the logic and conditions to better suit your application's requirements.
 */

export type RoleBasedGuardProp = {
  sx?: SxProps<Theme>;
  hasContent?: boolean;
  allowedRoles: string | string[];
  children: React.ReactNode;
};

export function RoleBasedGuard({ sx, children, hasContent, allowedRoles }: RoleBasedGuardProp) {
  const { user, loading, authenticated } = useAuthContext();
  const { pathname } = useLocation();

  const isAllowed = useMemo(() => {
    // If still loading, don't make any decisions yet
    if (loading) {
      return true;
    }

    // If user is not authenticated, they need to login first (not access denied)
    if (!authenticated || !user) {
      return null; // null means "needs authentication"
    }

    // If user has no role, deny access
    if (!user?.role) {
      return false;
    }

    // Convert allowedRoles to array if it's a string
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if user's role is in the allowed roles
    return roles.includes(user.role);
  }, [user, allowedRoles, loading, authenticated]);

  // Show loading screen while checking permissions
  if (loading) {
    return <SplashScreen />;
  }

  // If not authenticated, redirect to login with returnTo
  if (isAllowed === null) {
    const queryString = new URLSearchParams({ returnTo: pathname }).toString();
    return <Navigate to={`${paths.auth.jwt.signIn}?${queryString}`} replace />;
  }

  // If authenticated but not allowed (wrong role), show access denied
  if (!isAllowed) {
    return <Navigate to={paths.auth.accessDenied} state={{ from: pathname }} replace />;
  }

  // If allowed, render children
  return <>{children}</>;
}
