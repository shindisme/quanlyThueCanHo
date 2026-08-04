import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as notificationService from "../../../../services/notificationService";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
import { useSort } from "../../../../hooks/useSort";
import { useUserRole } from "../../../../hooks/useUserRole";
import type { Notification } from "../../../../types";

export function useNotificationCenter() {
  const queryClient = useQueryClient();
  const { role } = useUserRole();

  const [search, setSearch] = useState("");
  const [isReadFilter, setIsReadFilter] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);

  // Lấy danh sách thông báo đã nhận
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ["notifications", isReadFilter, debouncedSearch],
    queryFn: () => {
      const isReadVal = isReadFilter === "true" ? true : isReadFilter === "false" ? false : undefined;
      return notificationService.getAllNotifications({
        is_read: isReadVal,
        search: debouncedSearch || undefined,
        limit: 100,
      });
    },
  });

  // Sort 
  const { items: sortedNotifications, requestSort, getSortIcon, sortConfig } = useSort<Notification>(notifications, {
    key: "created_at",
    direction: "desc",
  });

  // Pagination
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedNotifications.length,
    initialPageSize: 10,
  });

  const paginatedNotifications = useMemo(() => {
    return sortedNotifications.slice(startIdx, endIdx);
  }, [sortedNotifications, startIdx, endIdx]);

  // Cập nhật trạng thái đã đọc của từng thông báo đơn lẻ
  const markReadMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: number; isRead: boolean }) =>
      notificationService.markNotificationRead(id, isRead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["header-notifications"] });
    },
    onError: (err) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Cập nhật trạng thái thông báo thất bại");
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Đã đánh dấu đọc tất cả thông báo");
    },
    onError: (err) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Đánh dấu thất bại");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Đã xóa thông báo");
    },
    onError: (err) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Xóa thông báo thất bại");
    },
  });

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  return {
    role,
    notifications: paginatedNotifications,
    rawCount: notifications.length,
    unreadCount,
    isLoading,
    search,
    setSearch,
    isReadFilter,
    setIsReadFilter,

    markRead: (id: number, isRead: boolean = true) => markReadMutation.mutate({ id, isRead }),
    markAllRead: markAllReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,

    // Sort và Pagination
    requestSort,
    getSortIcon,
    sortConfig,
    currentPage,
    setCurrentPage,
    totalPages,

    refetch,
  };
}
