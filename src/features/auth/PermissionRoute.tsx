import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { AccessDenied } from "./AccessDenied";

interface PermissionRouteProps {
  permission: string;
  redirectTo?: string;
}

/**
 * Wraps a Route and renders AccessDenied when the user lacks the required permission.
 * Renders a loading state while auth is being resolved.
 */
export function PermissionRoute({ permission, redirectTo }: PermissionRouteProps) {
  const { loading, user, hasPermission } = useAuth();

  if (loading) return null; // ProtectedRoute already shows a loader

  if (!user) return <Navigate to="/login" replace />;

  if (!hasPermission(permission)) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return <AccessDenied />;
  }

  return <Outlet />;
}
