import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router';

import { paths } from 'src/routes/paths';

import { useUserAccess } from 'src/hooks/use-user-access';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

// Authorized users who can always see Invoice section and manage User Access
const AUTHORIZED_INVOICE_ADMINS = [
  'kiwoon@eaglegreen.ca',
  'kesia@eaglegreen.ca',
  'matth@eaglegreen.ca',
  'joec@eaglegreen.ca',
];

export type InvoiceAccessGuardProp = {
  sx?: SxProps<Theme>;
  children: React.ReactNode;
};

export function InvoiceAccessGuard({ sx, children }: InvoiceAccessGuardProp) {
  const { user, loading, authenticated } = useAuthContext();
  const { hasInvoiceAccess, isLoading: isLoadingAccess } = useUserAccess();
  const { pathname } = useLocation();

  const isAllowed = useMemo(() => {
    // If still loading, don't make any decisions yet
    if (loading || isLoadingAccess) {
      return true;
    }

    // If user is not authenticated, they need to login first
    if (!authenticated || !user) {
      return null; // null means "needs authentication"
    }

    // If user is not admin, deny access
    if (user.role !== 'admin') {
      return false;
    }

    // Check if user is authorized admin (always has access)
    const isAuthorized = user.email && AUTHORIZED_INVOICE_ADMINS.includes(user.email.toLowerCase());
    if (isAuthorized) {
      return true;
    }

    // Check if user has invoice access
    return hasInvoiceAccess;
  }, [user, hasInvoiceAccess, loading, isLoadingAccess, authenticated]);

  // Show loading screen while checking permissions
  if (loading || isLoadingAccess) {
    return <SplashScreen />;
  }

  // If not authenticated, redirect to login with returnTo
  if (isAllowed === null) {
    const queryString = new URLSearchParams({ returnTo: pathname }).toString();
    return <Navigate to={`${paths.auth.jwt.signIn}?${queryString}`} replace />;
  }

  // If authenticated but not allowed (no invoice access), show access denied
  if (!isAllowed) {
    return <Navigate to={paths.auth.accessDenied} state={{ from: pathname }} replace />;
  }

  // If allowed, render children
  return <>{children}</>;
}


