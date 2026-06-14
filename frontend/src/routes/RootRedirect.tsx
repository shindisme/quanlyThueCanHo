import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";

export default function RootRedirect() {
  const { token, role } = useAuthStore();

  // 1. Nếu chưa đăng nhập (không có token) -> Chuyển hướng về trang /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Nếu đã đăng nhập (có token) -> Chuyển hướng về trang dashboard tương ứng với Role của họ
  const redirectPath =
    role === "ADMIN"
      ? "/admin/dashboard"
      : role === "MANAGER"
      ? "/manager/dashboard"
      : "/tenant/home";

  return <Navigate to={redirectPath} replace />;
}
