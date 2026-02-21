import { Navigate, useLocation } from 'react-router';

import { paths } from 'src/routes/paths';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

/**
 * Guard for /works routes:
 * - Admin: full access
 * - Field supervisor: only /works/jobs/flra and /works/incident-report
 * - Other roles (e.g. LCT): access denied (same as role guard, no layout mount)
 */
export function WorkRoutesGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, authenticated } = useAuthContext();
  const { pathname } = useLocation();

  if (loading) {
    return <SplashScreen />;
  }

  if (!authenticated || !user) {
    const queryString = new URLSearchParams({ returnTo: pathname }).toString();
    return <Navigate to={`${paths.auth.jwt.signIn}?${queryString}`} replace />;
  }

  if (!user.role) {
    return <Navigate to={paths.auth.accessDenied} state={{ from: pathname }} replace />;
  }

  // Only admin and field_supervisor may access any /works route at all
  if (user.role !== 'admin' && user.role !== 'field_supervisor') {
    return <Navigate to={paths.auth.accessDenied} state={{ from: pathname }} replace />;
  }

  // Field supervisor: only FLRA and Incident Report paths
  if (user.role === 'field_supervisor') {
    const allowedFlra = pathname.startsWith('/works/jobs/flra');
    const allowedIncidentReport = pathname.startsWith('/works/incident-report');
    if (!allowedFlra && !allowedIncidentReport) {
      return <Navigate to={paths.auth.accessDenied} state={{ from: pathname }} replace />;
    }
  }

  return <>{children}</>;
}
