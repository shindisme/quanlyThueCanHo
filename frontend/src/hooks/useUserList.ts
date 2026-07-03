import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as authService from "../services/authService";
import type { UserData } from "../services/authService";
import { useSort } from "./common/useSort";
import { useDebounce } from "./common/useDebounce";
import { useOnOff } from "./common/useOnOff";
import { useUserRole } from "./common/useUserRole";
import { removeVietnameseTones } from "../utils/string";

export function useUserList() {
  const queryClient = useQueryClient();
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
    onSuccess: () => {
      if (resetItem) {
        toast.success(`Đã đặt lại mật khẩu cho tài khoản "${resetItem.username}" về mặc định "123456"`);
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
    filtered,
    sortedUsers,
    requestSort,
    getSortIcon,
    handleDelete,
    confirmResetPassword,
    fetchUsers,
  };
}
