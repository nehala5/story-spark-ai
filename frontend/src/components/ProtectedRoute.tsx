import { Navigate, Outlet } from 'react-router-dom';
import { isLoggedIn, getUserInfo } from '../services/auth.service';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * ProtectedRoute Component
 * Guards a route by verifying:
 * 1. The user is logged in (valid token present).
 * 2. The user has an allowed role (if allowedRoles is specified).
 * Renders the children if provided, or the Outlet for nested routes.
 */
const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const user = getUserInfo();
    const userRole = user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // If user is authenticated but unauthorized, redirect to /explore
      return <Navigate to="/explore" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
