import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import { parseJwt } from "../../../../utils/jwt";
import * as staffService from "../../../../services/staffService";
import * as contractService from "../../../../services/contractService";

export interface HeaderUser {
  userId: number | null;
  userFullName: string;
  accountUsername: string;
  managedBuildingName: string | null;
  roleLabel: string;
}

export function useHeaderUser(): HeaderUser {
  const { email, role, token, managedBuildingName: storeBuildingName } = useAuthStore();
  const [managedBuildingName, setManagedBuildingName] = useState<string | null>(storeBuildingName);

  const decoded = token ? parseJwt(token) : null;
  const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;

  useEffect(() => {
    if (storeBuildingName) {
      setManagedBuildingName(storeBuildingName);
    }
  }, [storeBuildingName]);

  const { data: staffData } = useQuery({
    queryKey: ["header-user-staff", userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await staffService.getAllStaffs();
      return res.data.find((s) => s.user_id === userId) || null;
    },
    enabled: !!token && !!userId && (role === "MANAGER" || role === "STAFF"),
    staleTime: 300000,
  });

  const { data: tenantContract } = useQuery({
    queryKey: ["header-user-tenant", userId],
    queryFn: async () => {
      const contracts = await contractService.getAllContracts();
      return contracts && contracts.length > 0 ? contracts[0] : null;
    },
    enabled: !!token && !!userId && role === "TENANT",
    staleTime: 300000,
  });

  const storedFullName = email ? localStorage.getItem(`profile-fullname-${email}`) : null;

  let userFullName = storedFullName || (
    role === "ADMIN" ? "Quản trị viên"
    : role === "MANAGER" ? "Quản lý"
    : role === "STAFF" ? "Nhân viên"
    : "Người thuê"
  );

  let accountUsername = email?.split("@")[0] || "User";

  if (role === "ADMIN") {
    userFullName = storedFullName || "Quản trị viên";
    accountUsername = "admin";
  } else if ((role === "MANAGER" || role === "STAFF") && staffData) {
    if (staffData.full_name) userFullName = staffData.full_name;
    if (staffData.user?.username) accountUsername = staffData.user.username;
    if (staffData.building?.branch_name && !storeBuildingName) {
      setManagedBuildingName(staffData.building.branch_name);
    }
  } else if (role === "TENANT" && tenantContract) {
    if (tenantContract.tenant?.full_name) {
      userFullName = tenantContract.tenant.full_name;
    }
    const branchName = tenantContract.apartment?.building?.branch_name;
    if (branchName && !storeBuildingName) {
      setManagedBuildingName(branchName);
    }
  }

  const activeBuildingName = storeBuildingName || managedBuildingName;

  const roleLabel =
    role === "ADMIN" ? "Quản trị viên"
      : role === "MANAGER" ? (activeBuildingName ? `Quản lý: ${activeBuildingName}` : "Quản lý")
        : role === "STAFF" ? (activeBuildingName ? `Kỹ thuật: ${activeBuildingName}` : "Nhân viên kỹ thuật")
          : role === "TENANT" ? (activeBuildingName ? `Cư dân: ${activeBuildingName}` : "Cư dân")
            : "Người dùng";

  return {
    userId,
    userFullName,
    accountUsername,
    managedBuildingName: activeBuildingName,
    roleLabel,
  };
}
