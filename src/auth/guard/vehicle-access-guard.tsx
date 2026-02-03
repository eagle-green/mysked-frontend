import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router';

import { paths } from 'src/routes/paths';

import { useUserAccess } from 'src/hooks/use-user-access';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

export type VehicleAccessGuardProp = {
  sx?: SxProps<Theme>;
  children: React.ReactNode;
};

export function VehicleAccessGuard({ sx, children }: VehicleAccessGuardProp) {
  const { user, loading, authenticated } = useAuthContext();
  const { hasVehicleAccess, isLoading: isLoadingAccess } = useUserAccess();
  const { pathname } = useLocation();

  const isAllowed = useMemo(() => {
    if (loading) {
      return true;
    }
    if (!authenticated || !user) {
      return null;
    }
    if (user.role === 'admin') {
      return true;
    }
    // While user-access is loading, show loading (don't deny yet)
    if (isLoadingAccess) {
      return true;
    }
    // Use cached vehicle_access so guard doesn't deny when layout already has access
    return hasVehicleAccess;
  }, [user, hasVehicleAccess, loading, isLoadingAccess, authenticated]);

  if (loading || isLoadingAccess) {
    return <SplashScreen />;
  }

  if (isAllowed === null) {
    const queryString = new URLSearchParams({ returnTo: pathname }).toString();
    return <Navigate to={`${paths.auth.jwt.signIn}?${queryString}`} replace />;
  }

  if (!isAllowed) {
    return <Navigate to={paths.auth.accessDenied} state={{ from: pathname }} replace />;
  }

  return <>{children}</>;
}
