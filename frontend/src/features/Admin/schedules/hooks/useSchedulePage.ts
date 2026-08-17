import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as scheduleService from "../../../../services/scheduleService";
import * as buildingService from "../../../../services/buildingService";
import type { ViewingSchedule } from "../../../../types";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
import { useUserRole } from "../../../../hooks/useUserRole";
import { removeVietnameseTones, parseGuestName } from "../../../../utils/string";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { useConfirmSchedule } from "./useConfirmSchedule";
import { useCancelSchedule } from "./useCancelSchedule";
import { useDeleteSchedule } from "./useDeleteSchedule";
import { useMarkAttendedSchedule } from "./useMarkAttendedSchedule";
import { useMarkAbsentSchedule } from "./useMarkAbsentSchedule";
import { queryKeys } from "../../../../constants/queryKeys";

export function useSchedulePage() {
  const { role, managedBuildingId } = useUserRole();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [deleteItem, setDeleteItem] = useState<ViewingSchedule | null>(null);
  const [cancelItem, setCancelItem] = useState<ViewingSchedule | null>(null);
  const [viewItem, setViewItem] = useState<ViewingSchedule | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Get toàn bộ danh sách
  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: queryKeys.schedules.all,
    queryFn: () => scheduleService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });

  const loading = [loadingSchedules, loadingBuildings].some(Boolean);

  const buildingMap = useMemo(() => {
    return Object.fromEntries(buildings.map((b) => [b.id, b]));
  }, [buildings]);

  const displaySchedules = useMemo(() => {
    if (role === "MANAGER" && managedBuildingId) {
      return schedules.filter(
        (s) => s.apartment?.building_id === managedBuildingId
      );
    }
    return schedules;
  }, [role, managedBuildingId, schedules]);

  const normalizedSearch = useMemo(
    () => removeVietnameseTones(debouncedSearch.trim()),
    [debouncedSearch]
  );

  const filtered = useMemo(() => {
    return displaySchedules.filter((s) => {
      const cleanGuestName = parseGuestName(s.guest_name).name;
      const nameNorm = removeVietnameseTones(cleanGuestName);
      const phoneNorm = removeVietnameseTones(s.guest_phone);
      const roomNorm = removeVietnameseTones(s.apartment?.room_number || "");
      const buildingBranchNorm = removeVietnameseTones(
        s.apartment?.building_id ? buildingMap[s.apartment.building_id]?.branch_name || "" : ""
      );

      const matchesSearch =
        !normalizedSearch ||
        nameNorm.includes(normalizedSearch) ||
        phoneNorm.includes(normalizedSearch) ||
        roomNorm.includes(normalizedSearch) ||
        buildingBranchNorm.includes(normalizedSearch);

      const matchesStatus = !statusFilter || s.status === statusFilter;

      // Lọc theo ngày, tháng, năm đặt hẹn
      const schedDate = new Date(s.schedule_time);
      const matchesDay = !filterDay || schedDate.getDate() === Number(filterDay);
      const matchesMonth = !filterMonth || schedDate.getMonth() + 1 === Number(filterMonth);
      const matchesYear = !filterYear || schedDate.getFullYear() === Number(filterYear);

      return matchesSearch && matchesStatus && matchesDay && matchesMonth && matchesYear;
    });
  }, [
    displaySchedules,
    buildingMap,
    normalizedSearch,
    statusFilter,
    filterDay,
    filterMonth,
    filterYear,
  ]);

  const { currentPage, setCurrentPage, totalPages } = usePagination({
    totalItems: filtered.length,
    initialPageSize: 10,
  });

  const confirmMutation = useConfirmSchedule();
  const cancelMutation = useCancelSchedule();
  const deleteMutation = useDeleteSchedule();
  const attendedMutation = useMarkAttendedSchedule();
  const absentMutation = useMarkAbsentSchedule();

  function handleConfirm(id: number) {
    confirmMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Đã xác nhận lịch xem phòng");
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error, "Xác nhận thất bại"));
      },
    });
  }

  function handleMarkAttended(id: number) {
    attendedMutation.mutate(id, {
      onSuccess: () => {
        toast.info("Đã ghi nhận khách đến xem phòng");
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error, "Cập nhật thất bại"));
      },
    });
  }

  function handleMarkAbsent(id: number) {
    absentMutation.mutate(id, {
      onSuccess: () => {
        toast.info("Đã ghi nhận khách vắng mặt");
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error, "Cập nhật thất bại"));
      },
    });
  }

  function handleConfirmCancel(reason: string) {
    if (!cancelItem) return;
    cancelMutation.mutate(
      { id: cancelItem.id, reason },
      {
        onSuccess: () => {
          toast.success("Đã hủy lịch xem phòng thành công!");
          setCancelItem(null);
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error, "Hủy thất bại"));
        },
      }
    );
  }

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success("Đã xóa lịch xem phòng thành công!");
        setDeleteItem(null);
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error, "Xóa thất bại"));
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
    cancelItem,
    setCancelItem,
    viewItem,
    setViewItem,
    buildings,
    buildingMap,
    filtered,
    currentPage,
    setCurrentPage,
    totalPages,
    handleConfirm,
    handleMarkAttended,
    handleMarkAbsent,
    handleConfirmCancel,
    handleDelete,
    deleting: deleteMutation.isPending,
    canceling: cancelMutation.isPending,
  };
}
