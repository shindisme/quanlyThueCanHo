import { useAuthStore } from "../stores/auth.store";

export function useUserRole() {
  const { role, managedBuildingId, email } = useAuthStore();

  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isStaff = role === "STAFF";
  const isTenant = role === "TENANT";

  const hasWritePermission = isAdmin || isManager || isStaff;

  return {
    role,
    managedBuildingId,
    email,
    isAdmin,
    isManager,
    isStaff,
    isTenant,
    hasWritePermission,
  };
}
