import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as buildingService from "../../../../services/buildingService";
import * as reservationService from "../../../../services/reservationService";
import type { Apartment } from "../../../../types";
import type { Building } from "../../../../types";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useUserRole } from "../../../../hooks/useUserRole";
import { useSort } from "../../../../hooks/useSort";
import { removeVietnameseTones, formatApartmentDisplay } from "../../../../utils/string";
import { formatCurrency } from "../../../../utils/currency";
import { useDeleteApartment } from "./useDeleteApartment";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { apartmentService } from "../../../../services";

export function useApartmentPage() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useUserRole();

  // Tự động kiểm tra và giải phóng các khoản cọc giữ phòng hết hạn
  useEffect(() => {
    reservationService.expireReservations().then((res) => {
      if (res && res.count > 0) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APARTMENTS });
      }
    }).catch(() => { });
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
    queryFn: () => apartmentService.getAllPage({
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
        const rawSearch = debouncedSearch.trim().toLowerCase();
        const s = removeVietnameseTones(rawSearch);
        const searchDigits = rawSearch.replace(/\D/g, "");

        // 1. Khớp số phòng (hỗ trợ "101", "p.101", "p101", "01", "P.01")
        const rawRoom = removeVietnameseTones(apt.room_number.toLowerCase());
        const displayRoom = removeVietnameseTones(
          formatApartmentDisplay(apt.room_number, apt.floor).toLowerCase()
        );
        const roomMatch =
          rawRoom.includes(s) ||
          displayRoom.includes(s) ||
          displayRoom.replace(/\./g, "").includes(s.replace(/\./g, "")) ||
          (searchDigits !== "" && (rawRoom.includes(searchDigits) || displayRoom.includes(searchDigits)));

        // Khớp giá thuê
        const rawPriceStr = String(apt.rental_price || 0);
        const formattedPriceStr = removeVietnameseTones(
          formatCurrency(Number(apt.rental_price || 0)).toLowerCase()
        );
        const priceMatch =
          rawPriceStr.includes(s) ||
          formattedPriceStr.includes(s) ||
          (searchDigits !== "" && rawPriceStr.includes(searchDigits));

        // Khớp tên chi nhánh
        const buildingName = apt.building?.branch_name || buildingMap.get(apt.building_id)?.branch_name || "";
        const buildingMatch = removeVietnameseTones(buildingName.toLowerCase()).includes(s);

        // Khớp số tầng
        const floorMatch =
          removeVietnameseTones(`tầng ${apt.floor}`.toLowerCase()).includes(s) ||
          String(apt.floor) === s;

        if (!roomMatch && !priceMatch && !buildingMatch && !floorMatch) {
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
        toast.error(
          getApiErrorMessage(
            error,
            `Không thể xóa căn hộ P.${deleteItem.floor}${deleteItem.room_number}. Căn hộ này hiện đang có hợp đồng!`
          )
        );
      },
    });
  }

  return {
    role,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    startIdx,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    loading,
    totalCount: filtered.length,
    totalPages,
    filtered,
    paginatedApartments,
    sortedApartments: paginatedApartments,
    requestSort,
    getSortIcon,
    handleDelete,
    filterBuilding,
    setFilterBuilding,
    filterFloor,
    setFilterFloor,
    filterStatus,
    setFilterStatus,
    availableFloors,
    buildings,
    deleting: deleteMutation.isPending,
  };
}
