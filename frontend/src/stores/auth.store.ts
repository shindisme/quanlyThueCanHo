import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string;
  role: string | null;
  email: string | null;
  managedBuildingId: number | null;
  managedBuildingName: string | null;

  // Actions 
  setAuth: (token: string, role: string, email: string, managedBuildingId?: number | null, managedBuildingName?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: "",
      role: null,
      email: null,
      managedBuildingId: null,
      managedBuildingName: null,

      setAuth: (token, role, email, managedBuildingId = null, managedBuildingName = null) =>
        set({
          token,
          role,
          email,
          managedBuildingId,
          managedBuildingName,
        }),


      logout: () =>
        set({
          token: "",
          role: null,
          email: null,
          managedBuildingId: null,
          managedBuildingName: null,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);