import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as scheduleService from "../../../../services/scheduleService";
import * as buildingService from "../../../../services/buildingService";
import type { ViewingSchedule } from "../../../../types";
import type { Building } from "../../../../types";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
import { useUserRole } from "../../../../hooks/useUserRole";
import { useSort } from "../../../../hooks/useSort";
import { removeVietnameseTones, parseGuestName } from "../../../../utils/string";
import { useConfirmSchedule } from "./useConfirmSchedule";
import { useCancelSchedule } from "./useCancelSchedule";
import { useDeleteSchedule } from "./useDeleteSchedule";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useSchedulePage() {
  const { role, managedBuildingId } = useUserRole();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [deleteItem, setDeleteItem] = useState<ViewingSchedule | null>(null);
  const [viewItem, setViewItem] = useState<ViewingSchedule | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data: schedules = [], isLoading: loadingSchedules, refetch: fetchSchedules } = useQuery({
    queryKey: QUERY_KEYS.SCHEDULES,
    queryFn: () => scheduleService.getAllPage(),
    select: (res) => res.data as unknown as ViewingSchedule[],
  });

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data as unknown as Building[],
  });
  const loading = loadingSchedules || loadingBuildings;

  const displaySchedules = (() => {
    if (role === "MANAGER" && managedBuildingId) {
      return schedules.filter(
        (s) => s.apartment?.building_id === managedBuildingId
      );
    }
    return schedules;
  })();

  const filtered = displaySchedules.filter((s) => {
    const term = removeVietnameseTones(debouncedSearch);
    const cleanGuestName = parseGuestName(s.guest_name).name;
    const nameNorm = removeVietnameseTones(cleanGuestName);
    const phoneNorm = removeVietnameseTones(s.guest_phone);
    const roomNorm = removeVietnameseTones(s.apartment?.room_number || "");

    const matchesSearch =
      nameNorm.includes(term) || phoneNorm.includes(term) || roomNorm.includes(term);

    const matchesStatus = !statusFilter || s.status === statusFilter;

    // Date filters
    const schedDate = new Date(s.schedule_time);
    const matchesDay = !filterDay || schedDate.getDate() === Number(filterDay);
    const matchesMonth = !filterMonth || schedDate.getMonth() + 1 === Number(filterMonth);
    const matchesYear = !filterYear || schedDate.getFullYear() === Number(filterYear);

    return matchesSearch && matchesStatus && matchesDay && matchesMonth && matchesYear;
  });

  const { items: sortedSchedules, requestSort, getSortIcon } = useSort(filtered, { key: "schedule_time", direction: "asc" }, {
    apartment_id: (s) => s.apartment?.room_number || String(s.apartment_id),
    schedule_time: (s) => new Date(s.schedule_time).getTime(),
  });

  // Pagination
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: filtered.length,
    initialPageSize: 10,
  });

  const paginatedSchedules = sortedSchedules.slice(startIdx, endIdx);

  const confirmMutation = useConfirmSchedule();
  const cancelMutation = useCancelSchedule();
  const deleteMutation = useDeleteSchedule();

  function handleConfirm(id: number) {
    confirmMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Đã xác nhận lịch xem phòng");
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || "Xác nhận thất bại");
      },
    });
  }

  function handleMarkAttended(id: number) {
    confirmMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Xác nhận khách đã đến xem phòng thành công!");
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || "Cập nhật thất bại");
      },
    });
  }

  function handleMarkNoShow(id: number) {
    cancelMutation.mutate(id, {
      onSuccess: () => {
        toast.info("Đã ghi nhận khách vắng mặt (No-show)");
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || "Cập nhật thất bại");
      },
    });
  }

  function handleCancel(id: number) {
    cancelMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Đã hủy lịch xem phòng");
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || "Hủy thất bại");
      },
    });
  }

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success("Đã xóa lịch xem phòng thành công!");
        setDeleteItem(null);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || "Xóa thất bại");
      },
    });
  }

  return {
    role,
    schedules,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filterDay,
    setFilterDay,
    filterMonth,
    setFilterMonth,
    filterYear,
    setFilterYear,
    deleteItem,
    setDeleteItem,
    viewItem,
    setViewItem,
    buildings,
    filtered,
    sortedSchedules,
    requestSort,
    getSortIcon,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedSchedules,
    handleConfirm,
    handleMarkAttended,
    handleMarkNoShow,
    handleCancel,
    handleDelete,
    fetchSchedules,
    deleting: deleteMutation.isPending,
  };
}
