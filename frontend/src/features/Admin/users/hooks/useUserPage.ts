import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import type { User } from "../../../../types";
import { toast } from "sonner";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

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

  const { data: usersRes, isLoading: loadingUsers, refetch: fetchUsers } = useUsers();
  const users = (usersRes?.data || []) as User[];

  const { data: tenantsRes, isLoading: loadingTenants } = useQuery({
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: () => tenantService.getAllTenantsPage(),
    select: (res) => res.data,
  });
  const tenants = tenantsRes || [];

  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: QUERY_KEYS.STAFF,
    queryFn: () => staffService.getAllStaffsPage(),
    select: (res) => res.data,
  });
  const staff = staffRes || [];

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: QUERY_KEYS.CONTRACTS,
    queryFn: () => contractService.getAllContractsPage(),
    select: (res) => res.data,
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: QUERY_KEYS.APARTMENTS,
    queryFn: () => apartmentService.getAllApartmentsPage(),
    select: (res) => res.data,
  });

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllBuildingsPage(),
    select: (res) => res.data,
  });

  const loading =
    loadingUsers ||
    loadingTenants ||
    loadingStaff ||
    loadingContracts ||
    loadingApartments ||
    loadingBuildings;

  function getTenantForUser(u: User) {
    const matched = tenants.find(
      (t) =>
        t.user_id === u.id ||
        (t.user && t.user.id === u.id) ||
        (t.email && u.username && t.email.toLowerCase() === u.username.toLowerCase())
    );
    if (matched) return matched;
    return u.tenant ?? u.tenant_profile ?? null;
  }

  function getUserFullName(u: User): string {
    if (u.role === "TENANT") {
      const match = getTenantForUser(u);
      if (match) return match.full_name;
    } else if (u.role === "MANAGER" || u.role === "STAFF") {
      const match = staff.find(
        (s) =>
          s.user_id === u.id ||
          (s.user && s.user.id === u.id) ||
          (s.user && s.user.username === u.username)
      );
      if (match) return match.full_name;
    }
    if (u.role === "ADMIN") {
      const storedName = u.username ? localStorage.getItem(`profile-fullname-${u.username}`) : null;
      return storedName || "Quản trị viên";
    }
    return "-";
  }

  function getUserBranch(u: User): string {
    if (u.role === "ADMIN") return "Không";
    if (u.role === "TENANT") {
      const matchTenant = getTenantForUser(u);
      if (matchTenant) {
        const tenantContracts = matchTenant.contracts?.length
          ? matchTenant.contracts
          : contracts.filter((c) => c.tenant_id === matchTenant.id);
        const activeContract = tenantContracts.find((c) => c.status === "ACTIVE");
        if (activeContract) {
          const apt =
            activeContract.apartment ??
            apartments.find((a) => a.id === activeContract.apartment_id);
          const bld =
            apt?.building ??
            (apt ? buildings.find((b) => b.id === apt.building_id) : null);
          if (apt) {
            return `${bld?.branch_name || "Chi nhánh khác"} - P.${apt.floor}${apt.room_number}`;
          }
        }
      }
    } else if (u.role === "MANAGER" || u.role === "STAFF") {
      const matchStaff = staff.find(
        (s) =>
          s.user_id === u.id ||
          (s.user && s.user.id === u.id) ||
          (s.user && s.user.username === u.username)
      );
      if (matchStaff && matchStaff.building_id) {
        const bld = buildings.find((b) => b.id === matchStaff.building_id);
        if (bld) return bld.branch_name;
      }
      if (u.managed_building?.branch_name) {
        return u.managed_building.branch_name;
      }
    }
    return "Không";
  }

  function getUserBuildingId(u: User): number | null {
    if (u.role === "TENANT") {
      const matchTenant = getTenantForUser(u);
      if (matchTenant) {
        const tenantContracts = matchTenant.contracts?.length
          ? matchTenant.contracts
          : contracts.filter((c) => c.tenant_id === matchTenant.id);
        const activeContract = tenantContracts.find((c) => c.status === "ACTIVE");
        if (activeContract) {
          const apt =
            activeContract.apartment ??
            apartments.find((a) => a.id === activeContract.apartment_id);
          return apt?.building_id || null;
        }
      }
    } else if (u.role === "MANAGER" || u.role === "STAFF") {
      const matchStaff = staff.find(
        (s) =>
          s.user_id === u.id ||
          (s.user && s.user.id === u.id) ||
          (s.user && s.user.username === u.username)
      );
      return matchStaff?.building_id || null;
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = (users as any[]).filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter && u.status !== statusFilter) return false;
    if (buildingFilter) {
      const uBldId = getUserBuildingId(u);
      if (uBldId !== Number(buildingFilter)) return false;
    }

    const term = removeVietnameseTones(debouncedSearch);
    if (!term) return true;
    const usernameNorm = removeVietnameseTones(u.username || "");
    const roleNorm = removeVietnameseTones(u.role || "");
    const branchNorm = removeVietnameseTones(getUserBranch(u));
    const fullNameNorm = removeVietnameseTones(getUserFullName(u));
    return (
      usernameNorm.includes(term) ||
      roleNorm.includes(term) ||
      branchNorm.includes(term) ||
      fullNameNorm.includes(term)
    );
  });

  const rolePriority: Record<string, number> = {
    ADMIN: 1,
    MANAGER: 2,
    STAFF: 3,
    TENANT: 4,
  };

  const defaultSortedFiltered = [...filtered].sort((a, b) => {
    const priorityA = rolePriority[a.role] || 99;
    const priorityB = rolePriority[b.role] || 99;
    return priorityA - priorityB;
  });

  const { items: sortedUsers, requestSort, getSortIcon } = useSort(
    defaultSortedFiltered,
    null,
    {
      branch: (u) => getUserBranch(u),
    }
  );

  const pagination = usePagination({
    totalItems: filtered.length,
    initialPageSize: 10,
  });

  const paginatedUsers = sortedUsers.slice(pagination.startIdx, pagination.endIdx);

  const deleteMutation = useDeleteUser();
  const resetMutation = useResetPasswordUser();

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success("Đã xóa tài khoản");
        setDeleteItem(null);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || "Xóa thất bại");
      },
    });
  }

  function confirmResetPassword() {
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
  }

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
