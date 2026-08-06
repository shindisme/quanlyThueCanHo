import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useUsers } from "./useUsers";
import { useDeleteUser } from "./useDeleteUser";
import { useResetPasswordUser } from "./useResetPasswordUser";
import * as tenantService from "../../../../services/tenantService";
import * as staffService from "../../../../services/staffService";
import * as contractService from "../../../../services/contractService";
import * as apartmentService from "../../../../services/apartmentService";
import * as buildingService from "../../../../services/buildingService";
import { useSort } from "../../../../hooks/useSort";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { useUserRole } from "../../../../hooks/useUserRole";
import { usePagination } from "../../../../hooks/usePagination";
import { removeVietnameseTones } from "../../../../utils/string";
import type { User, Tenant, Staff, Contract, Apartment, Building } from "../../../../types";
import { toast } from "sonner";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

const ROLE_SORT_MAP: Record<string, string> = {
  ADMIN: "1_Admin",
  MANAGER: "2_Quản lý",
  STAFF: "3_Nhân viên",
  TENANT: "4_Người thuê",
};

export function useUserPage() {
  const { isAdmin } = useUserRole();
  const createModal = useOnOff();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [deleteItem, setDeleteItem] = useState<User | null>(null);
  const [resetItem, setResetItem] = useState<User | null>(null);
  const [viewItem, setViewItem] = useState<User | null>(null);
  const [modifyItem, setModifyItem] = useState<User | null>(null);

  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");

  const { data: users = [], isLoading: loadingUsers, refetch: fetchUsers } = useUsers();

  const { data: tenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: () => tenantService.getAllPage(),
    select: (res) => res.data || [],
  });

  const { data: staff = [], isLoading: loadingStaff } = useQuery({
    queryKey: QUERY_KEYS.STAFF,
    queryFn: () => staffService.getAllPage(),
    select: (res) => res.data || [],
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: QUERY_KEYS.CONTRACTS,
    queryFn: () => contractService.getAllContractsPage(),
    select: (res) => res.data || [],
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: QUERY_KEYS.APARTMENTS,
    queryFn: () => apartmentService.getAllPage(),
    select: (res) => res.data || [],
  });

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data || [],
  });

  const loading =
    loadingUsers ||
    loadingTenants ||
    loadingStaff ||
    loadingContracts ||
    loadingApartments ||
    loadingBuildings;

  const tenantMap = useMemo(() => {
    const map = new Map<string | number, Tenant>();
    tenants.forEach((t) => {
      if (t.user_id) map.set(t.user_id, t);
      if (t.user?.id) map.set(t.user.id, t);
      if (t.email) map.set(t.email.toLowerCase(), t);
    });
    return map;
  }, [tenants]);

  const staffMap = useMemo(() => {
    const map = new Map<number, Staff>();
    staff.forEach((s) => {
      if (s.user_id) map.set(s.user_id, s);
      if (s.user?.id) map.set(s.user.id, s);
    });
    return map;
  }, [staff]);

  const buildingMap = useMemo(() => {
    const map = new Map<number, Building>();
    buildings.forEach((b) => map.set(b.id, b));
    return map;
  }, [buildings]);

  const apartmentMap = useMemo(() => {
    const map = new Map<number, Apartment>();
    apartments.forEach((a) => map.set(a.id, a));
    return map;
  }, [apartments]);

  const contractsByTenantMap = useMemo(() => {
    const map = new Map<number, Contract[]>();
    contracts.forEach((c) => {
      if (c.tenant_id) {
        const list = map.get(c.tenant_id) || [];
        list.push(c);
        map.set(c.tenant_id, list);
      }
    });
    return map;
  }, [contracts]);

  const getTenantForUser = useCallback(
    (u: User): Tenant | null => {
      const byUserId = tenantMap.get(u.id);
      if (byUserId) return byUserId;
      if (u.username) {
        const byEmail = tenantMap.get(u.username.toLowerCase());
        if (byEmail) return byEmail;
      }
      return u.tenant ?? u.tenant_profile ?? null;
    },
    [tenantMap]
  );

  const getUserFullName = useCallback(
    (u: User): string => {
      if (u.role === "TENANT") {
        const match = getTenantForUser(u);
        if (match) return match.full_name;
      } else if (u.role === "MANAGER" || u.role === "STAFF") {
        const match = staffMap.get(u.id);
        if (match) return match.full_name;
      } else if (u.role === "ADMIN") {
        return "Quản trị viên";
      }
      return "-";
    },
    [getTenantForUser, staffMap]
  );

  const getUserApartment = useCallback(
    (u: User): Apartment | null => {
      if (u.role !== "TENANT") return null;
      const matchTenant = getTenantForUser(u);
      if (!matchTenant) return null;

      const tenantContracts = matchTenant.contracts?.length
        ? matchTenant.contracts
        : contractsByTenantMap.get(matchTenant.id) || [];

      const activeContract = tenantContracts.find((c) => c.status === "ACTIVE");
      if (!activeContract) return null;

      return activeContract.apartment ?? apartmentMap.get(activeContract.apartment_id) ?? null;
    },
    [getTenantForUser, contractsByTenantMap, apartmentMap]
  );

  const getUserBuildingId = useCallback(
    (u: User): number | null => {
      if (u.role === "TENANT") {
        const apt = getUserApartment(u);
        return apt?.building_id || null;
      }
      if (u.role === "MANAGER" || u.role === "STAFF") {
        const matchStaff = staffMap.get(u.id);
        return matchStaff?.building_id || null;
      }
      return null;
    },
    [getUserApartment, staffMap]
  );

  const getUserBranch = useCallback(
    (u: User): string => {
      if (u.role === "ADMIN") return "Không";
      if (u.role === "TENANT") {
        const apt = getUserApartment(u);
        if (apt) {
          const bld = apt.building ?? buildingMap.get(apt.building_id);
          return `${bld?.branch_name || "Chi nhánh khác"} - P.${apt.floor}${apt.room_number}`;
        }
      } else if (u.role === "MANAGER" || u.role === "STAFF") {
        const matchStaff = staffMap.get(u.id);
        if (matchStaff && matchStaff.building_id) {
          const bld = buildingMap.get(matchStaff.building_id);
          if (bld) return bld.branch_name;
        }
        if (u.managed_building?.branch_name) {
          return u.managed_building.branch_name;
        }
      }
      return "Không";
    },
    [getUserApartment, buildingMap, staffMap]
  );

  const normalizedSearch = useMemo(
    () => removeVietnameseTones(debouncedSearch),
    [debouncedSearch]
  );

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter && u.status !== statusFilter) return false;
      if (buildingFilter) {
        const uBldId = getUserBuildingId(u);
        if (uBldId !== Number(buildingFilter)) return false;
      }

      if (!normalizedSearch) return true;

      const usernameNorm = removeVietnameseTones(u.username || "");
      const roleNorm = removeVietnameseTones(u.role || "");
      const branchNorm = removeVietnameseTones(getUserBranch(u));
      const fullNameNorm = removeVietnameseTones(getUserFullName(u));

      return (
        usernameNorm.includes(normalizedSearch) ||
        roleNorm.includes(normalizedSearch) ||
        branchNorm.includes(normalizedSearch) ||
        fullNameNorm.includes(normalizedSearch)
      );
    });
  }, [users, roleFilter, statusFilter, buildingFilter, normalizedSearch, getUserBuildingId, getUserBranch, getUserFullName]);

  const defaultSortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return (b.id || 0) - (a.id || 0);
    });
  }, [filtered]);

  const { items: sortedUsers, requestSort, getSortIcon, sortConfig } = useSort(
    defaultSortedFiltered,
    null,
    {
      index: (u) => (u.created_at ? new Date(u.created_at).getTime() : u.id || 0),
      fullName: (u) => getUserFullName(u),
      username: (u) => u.username,
      role: (u) => ROLE_SORT_MAP[u.role] || u.role,
      branch: (u) => {
        const b = getUserBranch(u);
        return (!b || b === "-" || b === "Chưa phân công" || b === "Không" || b === "Trống") ? "zzz_Trống" : b;
      },
      status: (u) => (u.status === "ACTIVE" ? "1_Hoạt động" : "2_Tạm khóa"),
    }
  );

  const pagination = usePagination({
    totalItems: filtered.length,
    initialPageSize: 10,
  });

  const paginatedUsers = useMemo(() => {
    return sortedUsers.slice(pagination.startIdx, pagination.endIdx);
  }, [sortedUsers, pagination.startIdx, pagination.endIdx]);

  const deleteMutation = useDeleteUser();
  const resetMutation = useResetPasswordUser();

  const handleDelete = useCallback(() => {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success("Đã xóa tài khoản");
        setDeleteItem(null);
      },
      onError: (error: unknown) => {
        const err = error as AxiosError<{ error?: string; message?: string }>;
        toast.error(err.response?.data?.error || err.response?.data?.message || "Xóa thất bại");
      },
    });
  }, [deleteItem, deleteMutation]);

  const confirmResetPassword = useCallback(() => {
    if (!resetItem) return;
    resetMutation.mutate(resetItem.id, {
      onSuccess: () => {
        toast.success(
          `Đã đặt lại mật khẩu cho tài khoản "${resetItem.username}" về mặc định "123123"`
        );
        setResetItem(null);
      },
      onError: () => {
        toast.error("Đặt lại mật khẩu thất bại");
      },
    });
  }, [resetItem, resetMutation]);

  return {
    isAdmin,
    createModal,
    users,
    loading,
    search,
    setSearch,
    deleteItem,
    setDeleteItem,
    resetItem,
    setResetItem,
    viewItem,
    setViewItem,
    modifyItem,
    setModifyItem,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    buildingFilter,
    setBuildingFilter,
    buildings,
    filtered,
    sortedUsers: paginatedUsers,
    pagination,
    requestSort,
    sortConfig,
    getSortIcon,
    handleDelete,
    confirmResetPassword,
    fetchUsers,
    tenants,
    staff,
    getUserFullName,
    getUserBranch,
    deleting: deleteMutation.isPending,
    resetting: resetMutation.isPending,
  };
}
