import { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import PageLoader from 'components/loading/PageLoader';
import paths, { rootPaths } from 'routes/paths';

interface ProtectedRouteProps extends PropsWithChildren {
  // Restrict to specific roles (e.g. ["admin"] — see the /admin/* routes in
  // router.tsx). Omit to just require any authenticated user.
  roles?: string[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!token || !user) {
    return <Navigate to={paths.signin} state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={rootPaths.root} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
