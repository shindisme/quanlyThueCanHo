import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as buildingService from "../../../../services/buildingService";
import * as reservationService from "../../../../services/reservationService";
import { getAllApartmentsPage } from "../../../../services/apartmentService";
import type { Apartment } from "../../../../types";
import type { Building } from "../../../../types";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useUserRole } from "../../../../hooks/useUserRole";
import { useSort } from "../../../../hooks/useSort";
import { removeVietnameseTones } from "../../../../utils/string";
import { useDeleteApartment } from "./useDeleteApartment";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useApartmentPage() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useUserRole();

  // Tự động kiểm tra và giải phóng các khoản cọc giữ phòng hết hạn
  useEffect(() => {
    reservationService.expireReservations().then((res) => {
      if (res.data?.expired_count && res.data.expired_count > 0) {
        toast.info(`Đã tự động hủy giữ phòng & gửi Email thông báo cho ${res.data.expired_count} cọc quá hạn dọn vào.`);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APARTMENTS] });
      }
    }).catch(() => {
      /*empty*/
    });
  }, [queryClient]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFloor, setFilterFloor] = useState<number | "">("");
  const [filterBuilding, setFilterBuilding] = useState<number | undefined>(
    role === "MANAGER" ? (managedBuildingId || undefined) : undefined
  );

  const createModal = useOnOff();
  const modifyModal = useOnOff();

  const [editItem, setEditItem] = useState<Apartment | null>(null);
  const [deleteItem, setDeleteItem] = useState<Apartment | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Lấy danh sách tòa nhà
  const { data: buildings = [] } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data as unknown as Building[],
  });

  // Map ID tòa nhà
  const buildingMap = useMemo(() => {
    return new Map(buildings.map((b) => [b.id, b]));
  }, [buildings]);

  // Lấy danh sách căn hộ
  const { data: apartments = [], isLoading: loading } = useQuery({
    queryKey: [QUERY_KEYS.APARTMENTS[0], filterBuilding],
    queryFn: () => getAllApartmentsPage({
      building_id: filterBuilding,
    }),
    select: (res) => res.data,
  });

  // Danh sách tầng hiện có
  const availableFloors = useMemo(() => {
    return Array.from(new Set(apartments.map((a) => a.floor).filter(Boolean))).sort((a, b) => a - b);
  }, [apartments]);

  // Lọc danh sách căn hộ
  const filtered: Apartment[] = useMemo(() => {
    return apartments.filter((apt) => {
      if (debouncedSearch) {
        const s = removeVietnameseTones(debouncedSearch.toLowerCase());
        const roomMatch = removeVietnameseTones(apt.room_number.toLowerCase()).includes(s);
        const floorMatch =
          removeVietnameseTones(`tầng ${apt.floor}`.toLowerCase()).includes(s) ||
          String(apt.floor).includes(s);
        const buildingName = buildingMap.get(apt.building_id)?.branch_name.toLowerCase() || "";
        const buildingMatch = removeVietnameseTones(buildingName).includes(s);
        if (!roomMatch && !floorMatch && !buildingMatch) {
          return false;
        }
      }

      if (filterStatus && apt.status !== filterStatus) {
        return false;
      }

      if (filterFloor !== "" && apt.floor !== Number(filterFloor)) {
        return false;
      }

      return true;
    });
  }, [apartments, buildingMap, debouncedSearch, filterFloor, filterStatus]);

  const defaultSortedFiltered: Apartment[] = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const branchA = a.building?.branch_name || buildingMap.get(a.building_id)?.branch_name || "";
      const branchB = b.building?.branch_name || buildingMap.get(b.building_id)?.branch_name || "";
      const branchCompare = branchA.localeCompare(branchB, "vi");
      if (branchCompare !== 0) return branchCompare;

      if (a.floor !== b.floor) {
        return a.floor - b.floor;
      }
      return String(a.room_number).localeCompare(String(b.room_number), undefined, {
        numeric: true,
      });
    });
  }, [filtered, buildingMap]);

  const { items: sortedApartments, requestSort, getSortIcon } = useSort(defaultSortedFiltered);

  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: filtered.length,
    initialPageSize: 10,
  });

  const paginatedApartments = sortedApartments.slice(startIdx, endIdx);

  const deleteMutation = useDeleteApartment();

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success("Đã xóa căn hộ");
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
    managedBuildingId,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterFloor,
    setFilterFloor,
    availableFloors,
    filterBuilding,
    setFilterBuilding,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    buildings,
    loading,
    filtered,
    sortedApartments,
    requestSort,
    getSortIcon,
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
    paginatedApartments,
    handleDelete,
    deleting: deleteMutation.isPending,
  };
}
