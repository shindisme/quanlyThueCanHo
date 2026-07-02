import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as scheduleService from "../services/scheduleService";
import type { ScheduleData } from "../services/scheduleService";
import * as buildingService from "../services/buildingService";
import { useDebounce } from "./common/useDebounce";
import { usePagination } from "./common/usePagination";
import { useUserRole } from "./common/useUserRole";
import { useSort } from "./common/useSort";
import { removeVietnameseTones, parseGuestName } from "../utils/string";

export function useScheduleList() {
  const { role, managedBuildingId } = useUserRole();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteItem, setDeleteItem] = useState<ScheduleData | null>(null);
  const [viewItem, setViewItem] = useState<ScheduleData | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data: schedules = [], isLoading: loadingSchedules, refetch: fetchSchedules } = useQuery({
    queryKey: ["schedules"],
    queryFn: () => scheduleService.getSchedules(),
  });

  const { data: buildingsRes, isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings({ limit: 100 }),
  });

  const buildings = buildingsRes?.data || [];
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

    const matchesSearch = nameNorm.includes(term) ||
      phoneNorm.includes(term) ||
      roomNorm.includes(term);

    const matchesStatus = !statusFilter || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const { items: sortedSchedules, requestSort, getSortIcon } = useSort(filtered, null, {
    apartment_id: (s) => s.apartment?.room_number || String(s.apartment_id),
    schedule_time: (s) => new Date(s.schedule_time).getTime(),
  });

  // Pagination dùng hook dùng chung
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
    endIdx,
  } = usePagination({
    totalItems: filtered.length,
    initialPageSize: 10,
  });

  const paginatedSchedules = sortedSchedules.slice(startIdx, endIdx);

  async function handleConfirm(id: number) {
    try {
      await scheduleService.confirmSchedule(id);
      toast.success("Đã xác nhận lịch xem phòng");
      fetchSchedules();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Xác nhận thất bại");
    }
  }

  async function handleCancel(id: number) {
    try {
      await scheduleService.cancelSchedule(id);
      toast.success("Đã hủy lịch xem phòng");
      fetchSchedules();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Hủy thất bại");
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await scheduleService.deleteSchedule(deleteItem.id);
      toast.success("Đã xóa lịch xem phòng thành công!");
      setDeleteItem(null);
      fetchSchedules();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Xóa thất bại");
    }
  }

  return {
    role,
    schedules,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
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
    handleCancel,
    handleDelete,
    fetchSchedules,
  };
}
