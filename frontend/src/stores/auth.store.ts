import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string;
  role: string | null;
  email: string | null;

  // Actions 
  setAuth: (token: string, role: string, email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: "",
      role: null,
      email: null,

      setAuth: (token, role, email) =>
        set({
          token,
          role,
          email,
        }),


      logout: () =>
        set({
          token: "",
          role: null,
          email: null,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);