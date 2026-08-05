import { create } from "zustand";
import { persist } from "zustand/middleware";
import { logout as logoutRequest } from "../services/authService";
import type { Role } from "../constants/enums";

interface AuthState {
  token: string;
  role: Role | null;
  email: string | null;
  managedBuildingId: number | null;
  managedBuildingName: string | null;

  setAuth: (token: string, role: Role, email: string, managedBuildingId?: number | null, managedBuildingName?: string | null) => void;
  logout: () => Promise<void>;
}

const emptyAuthState = {
  token: "",
  role: null,
  email: null,
  managedBuildingId: null,
  managedBuildingName: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...emptyAuthState,

      setAuth: (token, role, email, managedBuildingId = null, managedBuildingName = null) =>
        set({
          token,
          role,
          email,
          managedBuildingId,
          managedBuildingName,
        }),

      logout: async () => {
        const { token } = get();

        try {
          if (token) {
            await logoutRequest(token);
          }
        } catch { /* empty */ } finally {
          set(emptyAuthState);
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
);