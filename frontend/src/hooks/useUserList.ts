import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as authService from "../services/authService";
import type { UserData } from "../services/authService";
import { useSort } from "./common/useSort";
import { useDebounce } from "./common/useDebounce";
import { useOnOff } from "./common/useOnOff";
import { useUserRole } from "./common/useUserRole";
import { removeVietnameseTones } from "../utils/string";

export function useUserList() {
  const { isAdmin } = useUserRole();
  const createModal = useOnOff();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [deleteItem, setDeleteItem] = useState<UserData | null>(null);
  const [resetItem, setResetItem] = useState<UserData | null>(null);
  const [viewItem, setViewItem] = useState<UserData | null>(null);

  const { data: users = [], isLoading: loading, refetch: fetchUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => authService.getAllUsers(),
  });

  // Lọc tìm kiếm
  const filtered = users.filter((u) => {
    const term = removeVietnameseTones(debouncedSearch);
    const usernameNorm = removeVietnameseTones(u.username || "");
    const roleNorm = removeVietnameseTones(u.role || "");
    return usernameNorm.includes(term) || roleNorm.includes(term);
  });

  const { items: sortedUsers, requestSort, getSortIcon } = useSort(filtered);

  // Xóa
  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await authService.deleteUser(deleteItem.id);
      toast.success("Đã xóa tài khoản");
      setDeleteItem(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Xóa thất bại");
    }
  }

  // Reset password
  async function confirmResetPassword() {
    if (!resetItem) return;
    try {
      await authService.resetPassword(resetItem.id);
      toast.success(`Đã đặt lại mật khẩu cho tài khoản "${resetItem.username}" về mặc định "123456"`);
      setResetItem(null);
    } catch {
      toast.error("Đặt lại mật khẩu thất bại");
    }
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
    filtered,
    sortedUsers,
    requestSort,
    getSortIcon,
    handleDelete,
    confirmResetPassword,
    fetchUsers,
  };
}
