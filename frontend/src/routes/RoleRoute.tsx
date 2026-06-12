import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import type { Role } from "../constants/enums";

// Bao ve route theo role
// Chi cho phep truy cap neu user dang nhap va co role phu hop
interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { token, role } = useAuthStore();

  // Chua dang nhap => ve trang login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Khong co quyen => ve dashboard cua role tuong ung
  if (role && !allowedRoles.includes(role)) {
    const redirectPath = role === "ADMIN" ? "/admin/dashboard"
      : role === "MANAGER" ? "/manager/dashboard"
      : "/tenant/home";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
