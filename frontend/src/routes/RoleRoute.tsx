import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { token, role } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role && !allowedRoles.includes(role)) {
    const redirectPath = role === "ADMIN" ? "/admin/dashboard"
      : role === "MANAGER" ? "/manager/dashboard"
        : "/tenant/home";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
