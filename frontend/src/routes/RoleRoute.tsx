import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import { getRoleHomeRoute, type Role } from "../constants";

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: readonly Role[];
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { token, role } = useAuthStore();

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getRoleHomeRoute(role)} replace />;
  }

  return <>{children}</>;
}
