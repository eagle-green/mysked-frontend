import { useAuthContext } from '../hooks';
import { Navigate, useLocation, useParams } from 'react-router';
import { paths } from 'src/routes/paths';
import { SplashScreen } from 'src/components/loading-screen';

type Props = {
  children: React.ReactNode;
};

export function UserSelfOrAdminGuard({ children }: Props) {
  const { user, loading } = useAuthContext();
  const { pathname } = useLocation();
  const { id } = useParams<{ id?: string }>();

  if (loading) {
    return <SplashScreen />;
  }

  // If not logged in or no role, deny access
  if (!user?.role) {
    return <Navigate to={paths.auth.accessDenied} state={{ from: pathname }} replace />;
  }

  // Allow if admin
  if (user.role === 'admin') {
    return <>{children}</>;
  }

  // Allow if user is editing their own account
  if (id) {
    if (user.id === id) {
      return <>{children}</>;
    }
    // If id param exists and doesn't match, deny
    return <Navigate to={paths.auth.accessDenied} state={{ from: pathname }} replace />;
  }

  // If no id param, allow any logged-in user (for /account/edit)
  return <>{children}</>;
}
