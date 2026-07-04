import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as authService from "../../services/authService";
import type { UserData } from "../../services/authService";
import * as tenantService from "../../services/tenantService";
import * as staffService from "../../services/staffService";
import { useSort } from "../common/useSort";
import { useDebounce } from "../common/useDebounce";
import { useOnOff } from "../common/useOnOff";
import { useUserRole } from "../common/useUserRole";
import { usePagination } from "../common/usePagination";
import { removeVietnameseTones } from "../../utils/string";

export function useUserList() {
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  const createModal = useOnOff();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [deleteItem, setDeleteItem] = useState<UserData | null>(null);
  const [resetItem, setResetItem] = useState<UserData | null>(null);
  const [viewItem, setViewItem] = useState<UserData | null>(null);
  const [modifyItem, setModifyItem] = useState<UserData | null>(null);

  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: users = [], isLoading: loading, refetch: fetchUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => authService.getAllUsers(),
  });

  const { data: tenantsRes } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantService.getAllTenants({ limit: 100 }),
  });
  const tenants = tenantsRes?.data || [];

  const { data: staffRes } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getAllStaff(),
  });
  const staff = staffRes?.data || [];

  function getUserFullName(u: UserData): string {
    if (u.role === "TENANT") {
      const match = tenants.find(
        (t) =>
          t.user_id === u.id ||
          (t.user && t.user.id === u.id) ||
          (t.email && t.email.toLowerCase() === u.username.toLowerCase())
      );
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
    const local = localStorage.getItem(`profile-fullname-${u.username}`);
    if (local) return local;
    if (u.role === "ADMIN") return "Quản trị viên";
    return "-";
  }

  // Lọc tìm kiếm
  const filtered = users.filter((u) => {
    // Role filter
    if (roleFilter && u.role !== roleFilter) return false;
    // Status filter
    if (statusFilter && u.status !== statusFilter) return false;

    const term = removeVietnameseTones(debouncedSearch);
    if (!term) return true;
    const usernameNorm = removeVietnameseTones(u.username || "");
    const roleNorm = removeVietnameseTones(u.role || "");
    return usernameNorm.includes(term) || roleNorm.includes(term);
  });

  const rolePriority: Record<string, number> = {
    ADMIN: 1,
    MANAGER: 2,
    STAFF: 3,
    TENANT: 4
  };

  const defaultSortedFiltered = [...filtered].sort((a, b) => {
    const priorityA = rolePriority[a.role] || 99;
    const priorityB = rolePriority[b.role] || 99;
    return priorityA - priorityB;
  });

  const { items: sortedUsers, requestSort, getSortIcon } = useSort(defaultSortedFiltered);

  const pagination = usePagination({
    totalItems: filtered.length,
    initialPageSize: 10,
  });

  const paginatedUsers = sortedUsers.slice(pagination.startIdx, pagination.endIdx);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => authService.deleteUser(id),
    onSuccess: () => {
      toast.success("Đã xóa tài khoản");
      setDeleteItem(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Xóa thất bại");
    },
  });

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id);
  }

  const resetMutation = useMutation({
    mutationFn: (id: number) => authService.resetPassword(id),
    onSuccess: (res) => {
      if (resetItem) {
        const initialPassword = (res as any).initial_password;
        toast.success(`Đã đặt lại mật khẩu cho tài khoản "${resetItem.username}" thành công! Mật khẩu khởi tạo: ${initialPassword || "123456"}`, { duration: 10000 });
      }
      setResetItem(null);
    },
    onError: () => {
      toast.error("Đặt lại mật khẩu thất bại");
    },
  });

  function confirmResetPassword() {
    if (!resetItem) return;
    resetMutation.mutate(resetItem.id);
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
  };
}
