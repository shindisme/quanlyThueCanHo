import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================
// AUTH STORE - Quản lý trạng thái đăng nhập
// ============================================================
//
// ZUSTAND LÀ GÌ?
// - Zustand = thư viện quản lý state (trạng thái) cho React
// - Đơn giản hơn Redux nhiều: tạo store = 1 function, dùng = 1 hook
//
// PERSIST LÀ GÌ?
// - persist = middleware (phần mở rộng) của zustand
// - Tự động lưu state vào localStorage
// - Khi user reload trang → state được khôi phục → không bị mất đăng nhập
//
// KEY "auth-storage": Tên key trong localStorage
// ============================================================

// Định nghĩa shape (cấu trúc) của auth state
interface AuthState {
  token: string;           // JWT token từ backend
  role: string | null;     // Role: ADMIN | MANAGER | TENANT
  email: string | null;    // Email user đang đăng nhập

  // Actions (hàm thay đổi state)
  setAuth: (token: string, role: string, email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Giá trị ban đầu - chưa đăng nhập
      token: "",
      role: null,
      email: null,

      // Lưu thông tin khi đăng nhập thành công
      // Gọi sau khi API /auth/login trả về token + role
      setAuth: (token, role, email) =>
        set({
          token,
          role,
          email,
        }),

      // Đăng xuất: xóa hết thông tin
      logout: () =>
        set({
          token: "",
          role: null,
          email: null,
        }),
    }),
    {
      // Tên key trong localStorage
      // Mở DevTools → Application → Local Storage để xem
      name: "auth-storage",
    }
  )
);