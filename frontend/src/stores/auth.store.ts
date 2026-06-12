import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";
import type { Role } from "../constants/enums";

// Luu trang thai dang nhap cua nguoi dung
// persist: luu vao localStorage de giu dang nhap khi reload trang
interface AuthState {
  token: string;
  user: User | null;
  role: Role | null;

  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: "",
      user: null,
      role: null,

      // Luu token va thong tin user khi dang nhap thanh cong
      setAuth: (token, user) =>
        set({
          token,
          user,
          role: user.role,
        }),

      // Xoa het khi dang xuat
      logout: () =>
        set({
          token: "",
          user: null,
          role: null,
        }),
    }),
    {
      name: "dukihome-auth",
    }
  )
);